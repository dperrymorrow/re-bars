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

    tagComponent(id, html, name) {
      const $tmp = document.createElement("div");
      $tmp.innerHTML = html;
      const $root = $tmp.firstElementChild;
      if ($tmp.children.length > 1 || $root.dataset.rbsWatch)
        throw new Error(`component:'${name}' must have one root node, and cannot be a {{#watch}}`);

      $root.dataset.rbsComp = id;
      return $tmp.innerHTML;
    },

    getStorage(appId, cId) {
      return cId
        ? this.findByPath(window.ReBars, `apps.${appId}.inst.${cId}`)
        : this.findByPath(window.ReBars, `apps.${appId}`);
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
    getPath: (appId, compId) => `rbs.apps.${appId}.inst.${compId}`,

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

    setKey(obj, path, val) {
      const arr = path.split(".");
      arr.reduce((pointer, key, index) => {
        if (!(key in pointer)) throw new Error(`${path} was not found in object`, obj);
        if (index + 1 === arr.length) pointer[key] = val;
        return pointer[key];
      }, obj);
    },
  };

  var Watcher = {
    create(appId, { id, props, methods, data, watchers, name }) {
      const cStore = Utils.getStorage(appId, id);
      const appStore = Utils.getStorage(appId);

      function _handler(path) {
        Object.entries(watchers).forEach(([watch, fn]) => {
          if (Utils.shouldRender(path, watch)) fn({ data: proxyData, methods });
        });

        Object.entries(cStore.renders).forEach(([eId, handler]) => {
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
                $target.style.display = html === "" ? "none" : "";

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
              delete cStore.renders[eId];
            }
          }
        });

        Object.keys(appStore.inst).forEach(cId => {
          if (!Utils.findComponent(cId)) {
            // will fire destory hook here...
            delete appStore.inst[cId];
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

      const proxyData = _buildProxy({ ...data(), $_componentId: id, $_appId: appId, ...props });
      return proxyData;
    },
  };

  const _getPath = (target, wildcard = true) => {
    if (target === undefined) throw new Error(`have passed undefined to watch helper in component '${name}'`);
    return typeof target === "object" ? `${target.ReBarsPath}${wildcard ? ".*" : ""}` : target;
  };

  const _watch = (path, render, { root }) => {
    const eId = Utils.randomId();
    const store = Utils.getStorage(root.$_appId, root.$_componentId);

    store.renders[eId] = {
      path,
      render,
    };
    return eId;
  };

  const _makeParams = args => {
    return args.map(param => {
      if (["[event]"].includes(param)) return param.replace("[", "").replace("]", "");
      if (param !== null && typeof parm === "object")
        throw new Error(
          `component:${name} must only pass primitives as argument to a handler. ${JSON.stringify(args, null, 2)}`
        );
      if (typeof param === "string") return `'${param}'`;
      return param;
    });
  };

  var Helpers = {
    register(appId, { instance, helpers, name }) {
      // component
      instance.registerHelper("component", function(cName, { hash: props }) {
        const cDefs = Utils.getStorage(appId).cDefs;

        Object.entries(props).forEach(([key, val]) => {
          if (typeof val === "function")
            throw new Error(`cannot pass a function as a prop. in '${name}' child '${cName}' prop '${key}'`);
        });

        if (!cDefs[cName]) throw new Error(`component:${name} child component ${cName} is not registered`);

        return new instance.SafeString(cDefs[cName].render(props));
      });

      // add component helpers
      Object.entries(helpers).forEach(([name, fn]) => instance.registerHelper(name, fn));
      // add ref helper
      instance.registerHelper("ref", key => new instance.SafeString(`data-rbs-ref="${key}"`));
      // watch helpers and debug
      instance.registerHelper("debug", function(obj, { data }) {
        const render = () => `<pre class="debug">${JSON.stringify(obj, null, 2)}</pre>`;
        const eId = _watch(_getPath(obj), render, data);
        return new instance.SafeString(Utils.wrapWatch(eId, render()));
      });

      instance.registerHelper("watch", function(...args) {
        const { fn, hash, data } = args.pop();

        const path = args
          .map(arg => _getPath(arg, false))
          .join(".")
          .split(",");

        const eId = _watch(path, () => fn(this), data);
        return Utils.wrapWatcher(eId, fn(this), hash);
      });

      // events, (just curries to the rbs.handlers)
      instance.registerHelper("method", function() {
        const [str, ...args] = arguments;
        const [methodName, eventType = "click"] = str.split(":");
        const { data } = args.pop();
        const { $_appId, $_componentId } = data.root;
        const params = _makeParams([$_appId, $_componentId, methodName, "[event]"].concat(args));
        return new instance.SafeString(`on${eventType}="rbs.handlers.trigger(${params.join(",")})"`);
      });

      instance.registerHelper("bound", (path, { hash = {}, data }) => {
        const { $_appId, $_componentId } = data.root;
        const val = Utils.findByPath(data.root, path);
        const ref = hash.ref || path;
        const params = _makeParams([$_appId, $_componentId, "[event]", path]);

        return new instance.SafeString(
          `value="${val}" data-rbs-ref="${ref}" oninput="rbs.handlers.bound(${params.join(",")})"`
        );
      });
    },
  };

  function create(appId, { name, template, data, helpers = {}, methods = {}, watchers = {}, components = [] }) {
    const appStore = Utils.getStorage(appId);

    data =
      data ||
      function() {
        return {};
      };

    if (!name) throw new Error("Each ReBars component should have a name");
    if (typeof data !== "function") throw new Error(`component:${name} data must be a function`);
    if (typeof template !== "string") throw new Error(`component:${name} needs a template string`);

    const instance = Handlebars.create();
    const templateFn = instance.compile(template);

    components.forEach(def => {
      if (!def.name) throw new Error("component needs a name", def);
      if (!appStore.cDefs[def.name]) appStore.cDefs[def.name] = create(appId, def);
    });

    Helpers.register(appId, { instance, helpers, name, components });

    return {
      render(props = {}) {
        const id = Utils.randomId();
        const scope = { props, methods, name };

        scope.methods = Object.entries(methods).reduce((bound, [name, method]) => {
          bound[name] = method.bind(scope);
          return bound;
        }, {});

        appStore.inst[id] = {
          scope,
          renders: {},
        };

        const proxyData = Watcher.create(appId, { methods, data, watchers, name, ...{ id, props } });
        scope.data = proxyData;
        return Utils.tagComponent(id, templateFn(proxyData), name);
      },
    };
  }

  var Component = {
    create,
  };

  function index({ $el, root, Handlebars = window.Handlebars }) {
    if (!Handlebars) throw new Error("ReBars need Handlebars in order to run!");

    window.rbs = window.ReBars = window.ReBars || {};
    window.ReBars.apps = window.ReBars.apps || {};
    window.ReBars.handlers = window.ReBars.handlers || {
      trigger(...args) {
        const [appId, cId, methodName, ...params] = args;
        const scope = Utils.getStorage(appId, cId).scope;
        const method = scope.methods[methodName];
        if (!method) throw new Error(`component:${scope.name} ${methodName} is not a defined method`);
        method(...params);
      },

      bound(appId, cId, event, path) {
        const scope = Utils.getStorage(appId, cId).scope;
        Utils.setKey(scope.data, path, event.target.value);
      },
    };

    const id = Utils.randomId();
    const storage = (window.ReBars.apps[id] = { cDefs: {}, inst: {} });

    if (!document.body.contains($el)) throw new Error("$el must be present in the document");

    $el.innerHTML = Component.create(id, root).render();

    return {
      id,
      storage,
    };
  }

  return index;

})));
