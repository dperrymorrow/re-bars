(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.ReBars = factory());
}(this, (function () { 'use strict';

  let counter = 1;

  var Utils = {
    findComponent: id => document.getElementById(id),
    wrapTemplate: (id, html) => `<span id="${id}">${html}</span>`,

    findRefs(id) {
      return Array.from(this.findComponent(id).querySelectorAll("[data-rbs-ref]")).reduce(
        (obj, $el) => {
          obj[$el.dataset.rbsRef] = $el;
          return obj;
        },
        {}
      );
    },

    shouldRender(path, watchPath) {
      if (path === watchPath) return true;

      const pathSegs = path.split(".");
      const watchSegs = watchPath.split(".");

      return watchSegs.every((seg, index) => {
        if (seg === pathSegs[index] || seg === "*") return true;
        return false;
      });
    },

    randomId: () => `rbs${counter++}`,

    setKey(obj, path, value) {
      const arr = path.split(".");
      arr.reduce((pointer, key, index) => {
        if (!(key in pointer)) throw new Error(`${path} was not found in object`, obj);
        if (index + 1 === arr.length) pointer[key] = value;
        return pointer[key];
      }, obj);
    },
  };

  function Watcher({ id, app, props, data, watchers, name }) {
    const cRef = app.storage.comp[id];

    function _handler(path) {
      Object.keys(watchers).forEach(watchPath => {
        if (Utils.shouldRender(path, watchPath)) {
          watchers[watchPath].call(null, { data: proxyData, props });
        }
      });

      Object.keys(cRef.renders).forEach(eId => {
        const handler = cRef.renders[eId];

        if (Utils.shouldRender(path, handler.path)) {
          const $target = Utils.findComponent(eId);
          if ($target) {
            $target.innerHTML = handler.render();
          } else {
            delete cRef.renders[eId];
          }
        }
      });

      Object.keys(app.storage.comp).forEach(cId => {
        if (!Utils.findComponent(cId)) {
          // will fire destory hook here...
          delete app.storage.comp[cId];
        }
      });
    }

    function _buildProxy(raw, tree = []) {
      return new Proxy(raw, {
        get: function(target, prop) {
          if (prop === "ReBarsPath") return tree.join(".");
          const value = Reflect.get(...arguments);
          if (value !== null && typeof value === "object" && prop !== "methods")
            return _buildProxy(value, tree.concat(prop));
          else return value;
        },

        set: function(target, prop) {
          const ret = Reflect.set(...arguments);
          _handler(tree.concat(prop).join("."));
          return ret;
        },

        deleteProperty: function(target, prop) {
          const ret = Reflect.deleteProperty(...arguments);
          _handler(tree.concat(prop).join("."));
          return ret;
        },
      });
    }

    const proxyData = _buildProxy({ ...data, ...props });
    return proxyData;
  }

  function EventHandlers(storage, { proxyData, instance, methods, id, props, app }) {
    const handlerPath = `rbs.apps.${app.id}.comp.${id}.ev`;

    function _handler() {
      const [eventType, methodName, ...args] = arguments;
      args.splice(-1, 1);

      const params = [methodName].concat(args).map(param => {
        if (param !== null && typeof parm === "object")
          throw new Error(
            `must only pass primitives as argument to a handler. ${JSON.stringify(args, null, 2)}`
          );
        if (typeof param === "string") return `'${param}'`;
        return param;
      });

      return new instance.SafeString(
        `on${eventType}="${handlerPath}.method(event, ${params.join(",")})"`
      );
    }

    storage.ev.bind = (event, path) => Utils.setKey(proxyData, path, event.currentTarget.value);
    storage.ev.method = function() {
      const [event, key, ...args] = arguments;

      return methods[key].call(
        methods,
        { data: proxyData, props, methods, $refs: Utils.findRefs(id) },
        event,
        ...args
      );
    };

    instance.registerHelper("method", _handler);
    instance.registerHelper(
      "bind",
      path => new instance.SafeString(`oninput="${handlerPath}.bind(event, '${path}')"`)
    );
  }

  function ReRenders(storage, { instance, proxyData }) {
    instance.registerHelper("watch", function(path, { fn }) {
      if (path === null)
        throw new Error("Rebars: cannot pass null to watch helper, pass a string or Object");

      if (typeof path === "object") {
        path = `${path.ReBarsPath}.*`;
      }
      const eId = Utils.randomId();
      storage.renders[eId] = {
        render: () => fn(proxyData),
        path,
      };
      return Utils.wrapTemplate(eId, fn(proxyData));
    });

    instance.registerHelper("watchEach", function(arr, { fn }) {
      if (!Array.isArray(arr)) throw new Error("watchEach must be passed an Array");
      const path = arr.ReBarsPath;

      return arr.map((item, index) => {
        const eId = Utils.randomId();
        storage.renders[eId] = {
          render: () => fn(item),
          path: `${path}.${index}.*`,
        };
        return Utils.wrapTemplate(eId, fn(item));
      });
    });
  }

  function Helpers({ instance, app, id, proxyData, components }) {
    const storage = app.storage.comp[id];

    ReRenders(storage, ...arguments);
    EventHandlers(storage, ...arguments);

    instance.registerHelper("component", function(name, { hash: props }) {
      return new instance.SafeString(
        app.component({
          ...components[name],
          ...{ parentData: proxyData, props },
        })
      );
    });

    instance.registerHelper("isChecked", val => (val ? "checked" : ""));
    instance.registerHelper("ref", key => new instance.SafeString(`data-rbs-ref="${key}"`));
    instance.registerHelper(
      "debug",
      obj => new instance.SafeString(`<pre class="debug">${JSON.stringify(obj, null, 2)}</pre>`)
    );
  }

  function index({ $el, root, Handlebars = window.Handlebars }) {
    if (!Handlebars) throw new Error("ReBars need Handlebars in order to run!");

    window.ReBars = window.ReBars || {};
    window.ReBars.apps = window.ReBars.apps || {};
    window.rbs = window.ReBars;

    const appId = Utils.randomId();
    const storage = (window.ReBars.apps[appId] = { comp: {} });
    const app = { component, id: appId, storage };

    $el.innerHTML = component(root);

    function component({
      template,
      components = {},
      methods = {},
      props = {},
      hooks = {},
      watchers = {},
      data = {},
      name,
    }) {
      const id = Utils.randomId();
      const instance = Handlebars.create();

      if (!name) throw new Error("Each ReBars component should have a name");

      storage.comp[id] = {
        renders: {},
        ev: {},
        hooks,
        name,
      };

      if (hooks.created) hooks.created(...arguments);
      // need to call created before building the proxy
      const proxyData = Watcher({ id, app, props, data, watchers, name });
      const templateFn = instance.compile(template);

      Helpers({
        id,
        instance,
        app,
        methods,
        components,
        proxyData,
        props,
        watchers,
      });

      if ("attached" in hooks) {
        const int = setInterval(() => {
          if (Utils.findComponent(id)) {
            clearInterval(int);
            hooks.attached({
              ...{ watchers, methods, data: proxyData, props },
              ...{ $refs: Utils.findRefs(id) },
            });
          }
        }, 10);
      }

      return Utils.wrapTemplate(id, templateFn(proxyData));
    }

    return {
      component,
      storage,
    };
  }

  return index;

})));
