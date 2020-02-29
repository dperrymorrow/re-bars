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

    shouldRender(path, watch) {
      const watchPaths = Array.isArray(watch) ? watch : [watch];
      return watchPaths.some(watchPath => {
        if (path === watchPath || watchPath === ".*") return true;

        const pathSegs = path.split(".");
        const watchSegs = watchPath.split(".");

        return watchSegs.every((seg, index) => {
          if (seg === pathSegs[index] || seg === "*") return true;
          return false;
        });
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

  function Watcher({ id, app, props = {}, methods, rawData = {}, watchers = {}, name }) {
    const cRef = app.storage.comp[id];

    function _handler(path) {
      Object.entries(watchers).forEach(([watch, fn]) => {
        if (Utils.shouldRender(path, watch)) fn({ data: proxyData, props, methods });
      });

      Object.entries(cRef.renders).forEach(([eId, handler]) => {
        if (Utils.shouldRender(path, handler.path)) {
          const $target = Utils.findComponent(eId);
          if ($target) {
            const $temp = document.createElement("div");
            $temp.innerHTML = handler.render();

            if ($target.innerHTML !== $temp.innerHTML) {
              $target.innerHTML = $temp.innerHTML;
            }
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

    const proxyData = _buildProxy({ ...rawData, ...props });
    return proxyData;
  }

  function EventHandlers(storage, { data, instance, methods, id, props, app, name }) {
    const handlerPath = `rbs.apps.${app.id}.comp.${id}.ev`;

    function _handler() {
      const [str, ...args] = arguments;
      const [methodName, eventType = "click"] = str.split(":");
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
        `on${eventType}="${handlerPath}.method(event,${params.join(",")})"`
      );
    }

    storage.ev.bind = (event, path) => Utils.setKey(data, path, event.currentTarget.value);
    storage.ev.method = function() {
      const [event, key, ...args] = arguments;

      if (!(key in methods))
        throw new Error(`${key} was not found in methods for component '${name}'`);

      return methods[key].call(
        methods,
        { data, props, methods, $refs: Utils.findRefs(id) },
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

  function ReRenders(storage, { instance, name }) {
    const _getPath = (target, wildcard = true) => {
      if (target === undefined)
        throw new Error(`have passed undefined to watch helper in component '${name}'`);
      return typeof target === "object" ? `${target.ReBarsPath}${wildcard ? ".*" : ""}` : target;
    };

    const _watch = (path, render) => {
      const eId = Utils.randomId();
      storage.renders[eId] = { path, render };
      return eId;
    };

    instance.registerHelper("debug", function(obj) {
      const render = () => `<pre class="debug">${JSON.stringify(obj, null, 2)}</pre>`;
      const eId = _watch(_getPath(obj), render);
      return new instance.SafeString(Utils.wrapTemplate(eId, render()));
    });

    instance.registerHelper("watch", function(...args) {
      const { fn } = args.pop();
      const path = args
        .map(arg => _getPath(arg, false))
        .join(".")
        .split(",");

      const eId = _watch(path, () => fn(this));
      return Utils.wrapTemplate(eId, fn(this));
    });
  }

  function Helpers({ instance, app, id, components, helpers, name }) {
    const storage = app.storage.comp[id];

    ReRenders(storage, ...arguments);
    EventHandlers(storage, ...arguments);

    instance.registerHelper("component", function(cName, { hash: props }) {
      Object.entries(props).forEach(([key, val]) => {
        if (typeof val === "function")
          throw new Error(
            `cannot pass a function as a prop. in '${name}' child '${cName}' prop '${key}'`
          );
      });

      return new instance.SafeString(
        app.component({
          ...components[cName],
          ...{ props },
        })
      );
    });

    Object.entries(helpers).forEach(([name, fn]) => instance.registerHelper(name, fn));
    instance.registerHelper("ref", key => new instance.SafeString(`data-rbs-ref="${key}"`));
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
      methods = {},
      props = {},
      hooks = {},
      name,
      components = {},
      data: rawData,
      watchers = {},
      helpers = {},
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

      if (hooks.created) hooks.created({ data: rawData, methods });
      // need to call created before building the proxy
      const proxyData = Watcher({ id, app, props, methods, rawData, watchers, name });
      const templateFn = instance.compile(template);

      Helpers({
        props,
        methods,
        id,
        components,
        instance,
        helpers,
        data: proxyData,
        name,
        app,
      });

      if ("attached" in hooks) {
        const int = setInterval(() => {
          if (Utils.findComponent(id)) {
            clearInterval(int);
            hooks.attached({ methods, data: proxyData, props, $refs: Utils.findRefs(id) });
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
