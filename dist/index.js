(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.ReBars = factory());
}(this, (function () { 'use strict';

  let counter = 1;

  var Utils = {
    findWatcher: id => document.querySelector(`[data-rbs-watch="${id}"]`),
    wrapWatcher: (id, html, hash) => {
      const { tag, ...props } = { ...{ tag: "span", class: "rbs-watch" }, ...hash };
      const propStr = Object.entries(props)
        .map(([key, val]) => `${key}="${val}"`)
        .join(" ");

      const style = !html.length ? "style='display:none;'" : "";

      return `<${tag} ${propStr} ${style} data-rbs-watch="${id}">${html}</${tag}>`;
    },

    tagComponent(appId, id, html, name) {
      const $tmp = document.createElement("div");
      $tmp.innerHTML = html;
      const $root = $tmp.firstElementChild;
      if ($tmp.children.length > 1 || $root.dataset.rbsWatch)
        throw new Error(`component:'${name}' must have one root node, and cannot be a {{#watch}}`);

      $root.dataset.rbsComp = id;
      return $tmp.innerHTML;
    },

    findComponent: id => document.querySelector(`[data-rbs-comp="${id}"]`),

    findRefs(parent) {
      const $el = typeof parent === "object" ? parent : this.findComponent(parent);

      return Array.from($el.querySelectorAll("[data-rbs-ref]")).reduce((obj, $el) => {
        const key = $el.dataset.rbsRef;
        const target = obj[$el.dataset.rbsRef];
        obj[key] = target ? [target].concat($el) : $el;
        return obj;
      }, {});
    },

    findByPath: (data, path) => path.split(".").reduce((pointer, seg) => pointer[seg], data),
    getPath: (appId, compId) => `rbs.apps.${appId}.comp.${compId}`,

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

    // the handling of change

    function _handler(path) {
      Object.entries(watchers).forEach(([watch, fn]) => {
        if (Utils.shouldRender(path, watch)) fn({ data: proxyData, props, methods });
      });

      Object.entries(cRef.renders).forEach(([eId, handler]) => {
        if (Utils.shouldRender(path, handler.path)) {
          const $target = Utils.findWatcher(eId);
          if ($target) {
            const html = handler.render();
            const $active = document.activeElement;
            const activeRef = {
              ref: $active.dataset.rbsRef,
              pos: $active.selectionStart,
            };

            if ($target.innerHTML !== html) {
              $target.removeAttribute("style");
              $target.innerHTML = html;
              const $input = Utils.findRefs($target)[activeRef.ref];

              if ($input) {
                if (Array.isArray($input)) ; else {
                  $input.focus();
                  if (activeRef.pos) $input.setSelectionRange(activeRef.pos + 1, activeRef.pos + 1);
                }
              }
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

    // the proxy building

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
    const handlerPath = `${Utils.getPath(app.id, id)}.ev`;

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

    storage.ev.bind = (event, path) => Utils.setKey(data, path, event.target.value);

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
    instance.registerHelper("bind", (path, { hash = {} }) => {
      const val = Utils.findByPath(data, path);
      const ref = hash.ref || path;
      return new instance.SafeString(
        `value="${val}" data-rbs-ref="${ref}" oninput="${handlerPath}.bind(event, '${path}')"`
      );
    });
  }

  function ReRenders(storage, { instance, name }) {
    const _getPath = (target, wildcard = true) => {
      if (target === undefined)
        throw new Error(`have passed undefined to watch helper in component '${name}'`);
      return typeof target === "object" ? `${target.ReBarsPath}${wildcard ? ".*" : ""}` : target;
    };

    const _watch = (path, render) => {
      const eId = Utils.randomId();
      storage.renders[eId] = {
        path,
        render,
      };
      return eId;
    };

    instance.registerHelper("debug", function(obj) {
      const render = () => `<pre class="debug">${JSON.stringify(obj, null, 2)}</pre>`;
      const eId = _watch(_getPath(obj), render);
      return new instance.SafeString(Utils.wrapWatch(eId, render()));
    });

    instance.registerHelper("watch", function(...args) {
      const { fn, hash } = args.pop();

      const path = args
        .map(arg => _getPath(arg, false))
        .join(".")
        .split(",");

      const eId = _watch(path, () => fn(this));
      return Utils.wrapWatcher(eId, fn(this), hash);
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

    if (!document.body.contains($el)) throw new Error("$el must be present in the document");

    $el.innerHTML = component(root);

    function component({
      template,
      methods = {},
      props = {},
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
        name,
      };

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

      return Utils.tagComponent(app.id, id, templateFn(proxyData), name);
    }

    return {
      id: appId,
      component,
      storage,
    };
  }

  return index;

})));
