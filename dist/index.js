(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.ReBars = factory());
}(this, (function () { 'use strict';

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

    randomId: () =>
      "_rbs_" +
      Math.random()
        .toString(36)
        .substr(2, 9),

    setKey(obj, path, value) {
      const arr = path.split(".");
      arr.reduce((pointer, key, index) => {
        if (!(key in pointer)) throw new Error(`${path} was not found in object`, obj);
        if (index + 1 === arr.length) pointer[key] = value;
        return pointer[key];
      }, obj);
    },
  };

  function Watcher({ id, app, parentData, props, data, watchers, name }) {
    function _handler(path) {
      const cRef = app.storage.components[id];

      Object.keys(watchers).forEach(watchPath => {
        if (Utils.shouldRender(path, watchPath)) {
          watchers[watchPath].call(null, { data: proxyData, parentData, props });
        }
      });

      Object.keys(cRef.renders).forEach(eId => {
        const handler = cRef.renders[eId];

        if (Utils.shouldRender(path, handler.path)) {
          const $target = Utils.findComponent(eId);
          if ($target) {
            $target.innerHTML = handler.render();
          } else {
            delete app.storage.components[eId];
          }
        }
      });

      Object.keys(app.storage.components).forEach(cId => {
        if (!Utils.findComponent(cId)) {
          delete app.storage.components[cId];
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

    const proxyData = _buildProxy(data);
    return proxyData;
  }

  function EventHandlers(
    storage,
    { proxyData, instance, methods, id, watchers, parentData, props, app }
  ) {
    const handlerPath = `ReBars.apps.${app.id}.components.${id}.handlers`;

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

      return new instance.SafeString(`on${eventType}="${handlerPath}.action(${params.join(",")})"`);
    }

    storage.handlers.bind = (event, path) => Utils.setKey(proxyData, path, event.currentTarget.value);

    storage.handlers.action = function() {
      const [key, ...args] = arguments;

      return methods[key].call(
        null,
        {
          methods,
          watchers,
          data: proxyData,
          parentData,
          props,
          $refs: Utils.findRefs(id),
          event,
        },
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
      const eId = Utils.randomId();
      storage.renders[eId] = { render: fn.bind(null, proxyData), path };
      return Utils.wrapTemplate(eId, fn(proxyData));
    });

    instance.registerHelper("watchEach", function(arr, { fn }) {
      if (!Array.isArray(arr)) throw new Error("watchEach must be passed an Array");
      const path = arr.ReBarsPath;

      return arr.map((item, index) => {
        const eId = Utils.randomId();
        storage.renders[eId] = {
          render: fn.bind(null, item),
          path: `${path}.${index}.*`,
        };
        return Utils.wrapTemplate(eId, fn(item));
      });
    });
  }

  function Helpers({ instance, app, id, proxyData, components }) {
    const storage = app.storage.components[id];

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
    const appId = Utils.randomId();
    const storage = (window.ReBars.apps[appId] = { components: {} });
    const app = { storage, component, id: appId };

    $el.innerHTML = component(root);

    function component({
      template,
      components = {},
      methods = {},
      parentData = {},
      props = {},
      hooks = {},
      watchers = {},
      data = {},
      name,
    }) {
      const id = Utils.randomId();
      const instance = Handlebars.create();

      if (!name) throw new Error("Each ReBars component should have a name");

      storage.components[id] = {
        handlers: {},
        renders: {},
        hooks,
      };

      // need to call created before building the proxy
      if (hooks.created) hooks.created(...arguments);
      const proxyData = Watcher({ id, app, parentData, props, data, watchers, name });
      const templateFn = instance.compile(template);

      Helpers({
        id,
        instance,
        app,
        methods,
        components,
        proxyData,
        parentData,
        props,
        watchers,
      });

      if ("attached" in hooks) {
        const int = setInterval(() => {
          if (Utils.findComponent(id)) {
            clearInterval(int);
            hooks.attached({
              ...{ watchers, methods, data: proxyData, parentData, props },
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
