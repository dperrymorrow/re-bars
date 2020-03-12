(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.ReBars = factory());
}(this, (function () { 'use strict';

  var Msg = {
    noName: () => "Each ReBars component should have a name",
    dataFn: ({ name }) => `component:${name} must be a function`,
    tplStr: ({ name }) => `component:${name} needs a template string`,
    propStomp: ({ name, key }) => `component:${name} data.${key} was overrode by props`,
    propUndef: ({ name, key }) => `component:${name} was passed undefined for prop "${key}"`,
    oneRoot: ({ name }) => `component:${name} must have one root node, and cannot be a {{#watch}} block`,
    noEl: () => "$el must be present in the document",
    noHbs: () => "ReBars need Handlebars in order to run!",
    noMethod: ({ name, methodName }) => `component:${name} does not have a method named "${methodName}"`,
    badPath: ({ path }) => `${path} was not found in object`,
    warn(key, obj) {
    },
    fail(key, obj) {
      throw new Error(this[key](obj));
    },
    log(key, obj) {
    },
  };

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

    isKeyedNode: $target => Array.from($target.children).every($el => $el.dataset.rbsRef),
    normalizeHtml: html => html.replace(new RegExp(/="rbs(.*?)"/g), ""),

    isEqHtml(item1, item2) {
      const $n1 = typeof item1 === "string" ? this.getShadow(item1) : this.getShadow(item1.innerHTML);
      const $n2 = typeof item2 === "string" ? this.getShadow(item2) : this.getShadow(item2.innerHTML);
      $n1.innerHTML = this.normalizeHtml($n1.innerHTML);
      $n2.innerHTML = this.normalizeHtml($n2.innerHTML);
      return $n1.isEqualNode($n2);
    },

    bindAll(scope, collection) {
      return Object.entries(collection).reduce((bound, [name, method]) => {
        bound[name] = method.bind(scope);
        return bound;
      }, {});
    },

    getShadow(html) {
      const $tmp = document.createElement("div");
      $tmp.innerHTML = html;
      return $tmp;
    },

    tagComponent(id, html, name) {
      const $tmp = this.getShadow(html);
      const $root = $tmp.firstElementChild;

      if (!$root || !$tmp.children || $tmp.children.length > 1 || $root.dataset.rbsWatch) Msg.fail("oneRoot", { name });

      $root.dataset.rbsComp = id;
      const content = $tmp.innerHTML;
      $tmp.remove();
      return content;
    },

    getStorage(appId, cId) {
      return cId
        ? this.findByPath(window.ReBars, `apps.${appId}.inst.${cId}`)
        : this.findByPath(window.ReBars, `apps.${appId}`);
    },

    findComponent: id => document.querySelector(`[data-rbs-comp="${id}"]`),
    findRef: ($parent, ref) => $parent.querySelector(`[data-rbs-ref="${ref}"]`),

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
        if (!(key in pointer)) Msg.fail("badPath", { path }, obj);
        if (index + 1 === arr.length) pointer[key] = val;
        return pointer[key];
      }, obj);
    },
  };

  function _restoreCursor($target, activeRef) {
    // this fetches all the refs, is this performant?
    const $input = Utils.findRef($target, activeRef.ref);

    if (!$input) return;
    if (Array.isArray($input)) ; else {
      $input.focus();
      if (activeRef.pos) $input.setSelectionRange(activeRef.pos + 1, activeRef.pos + 1);
    }
  }

  var ReRender = {
    init({ watchers, appId, compId, name }) {
      const cStore = Utils.getStorage(appId, compId);
      const appStore = Utils.getStorage(appId);

      function _checkWatchers(path) {
        Object.entries(watchers).forEach(([watch, fn]) => {
          if (Utils.shouldRender(path, watch)) fn();
        });
      }

      function _deleteOrphans() {
        Object.keys(appStore.inst).forEach(cId => {
          if (!Utils.findComponent(cId)) delete appStore.inst[cId];
        });
        Object.keys(cStore.renders).forEach(key => {
          if (!Utils.findWatcher(key)) delete cStore.renders[key];
        });
      }

      function _patchArr($target, html) {
        const $shadow = Utils.getShadow(html);
        const $vChilds = Array.from($shadow.children);

        // do deletes + changes first so its faster
        Array.from($target.children).forEach($r => {
          const $v = Utils.findRef($shadow, $r.dataset.rbsRef);
          if (!$v) $r.remove();
          else if (!Utils.isEqHtml($v, $r)) $r.replaceWith($v.cloneNode(true));
        });

        // additions;
        $vChilds.forEach(($v, index) => {
          const ref = $v.dataset.rbsRef;
          const $r = Utils.findRef($target, ref);
          if (!$r) {
            const $prev = $target.children[index];
            if ($prev) $target.insertBefore($v.cloneNode(true), $prev);
            else $target.append($v.cloneNode(true));
          }
        });

        $vChilds.forEach(($v, index) => {
          const ref = $v.dataset.rbsRef;
          const $el = $target.children[index];
          if ($el && $el.dataset.rbsRef !== ref) {
            $target.children[index].replaceWith($v.cloneNode(true));
          }
        });
      }

      return {
        patch(path) {
          _deleteOrphans();
          _checkWatchers(path);

          Object.entries(cStore.renders).forEach(([renderId, handler]) => {
            if (!Utils.shouldRender(path, handler.path)) return;

            const $target = Utils.findWatcher(renderId);
            if (!$target) return;
            const html = handler.render();

            if (Utils.isKeyedNode($target)) {
              _patchArr($target, html);
              if (appStore.trace) ;
              return;
            } else if (path.endsWith(".length")) ;

            if (Utils.isEqHtml($target.innerHTML, html)) return;

            const activeRef = {
              ref: document.activeElement.dataset.rbsRef,
              pos: document.activeElement.selectionStart,
            };

            $target.style.display = html === "" ? "none" : "";
            $target.innerHTML = html;

            _restoreCursor($target, activeRef);

            if (appStore.trace) ;
          });
        },
      };
    },
  };

  var ProxyTrap = {
    create({ appId, compId, $props, data, methods, name }) {
      let watching = false;
      const { patch } = ReRender.init(...arguments);

      function _buildProxy(raw, tree = []) {
        return new Proxy(raw, {
          get: function(target, prop) {
            if (prop === "ReBarsPath") return tree.join(".");
            const value = Reflect.get(...arguments);
            // not sure we need this anymore should only proxy the data...
            if (typeof value === "function" && target.hasOwnProperty(prop)) return value.bind(proxyData);
            if (value !== null && typeof value === "object" && prop !== "methods")
              return _buildProxy(value, tree.concat(prop));
            else return value;
          },

          set: function(target, prop) {
            const ret = Reflect.set(...arguments);
            const path = tree.concat(prop).join(".");
            if (!watching)
              throw new Error(
                `component:${name} set '${path}' before being added to the DOM. Usually caused by side effects from a hook or a data function, `
              );
            patch(path);
            return ret;
          },

          deleteProperty: function(target, prop) {
            const ret = Reflect.deleteProperty(...arguments);
            const path = tree.concat(prop).join(".");
            if (!watching)
              throw new Error(
                `component:${name} deleted '${path}' before being added to the DOM. Usually caused by side effects from a hook or a data function`
              );

            patch(path);
            return ret;
          },
        });
      }

      const proxyData = _buildProxy({
        ...data,
        ...$props,
        ...{ methods },
        $_componentId: compId,
        $_appId: appId,
      });
      return {
        watch: () => (watching = true),
        data: proxyData,
      };
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
      if (param !== null && typeof param === "object")
        throw new Error(
          `component:${name} must only pass primitives as argument to a handler. \n${JSON.stringify(param, null, 2)}`
        );
      if (typeof param === "string") return `'${param}'`;
      if (param === null) return `${param}`;
      return param;
    });
  };

  var Helpers = {
    register(appId, { instance, helpers, name }) {
      // component
      instance.registerHelper("component", function(cName, { hash: props }) {
        const cDefs = Utils.getStorage(appId).cDefs;
        if (!cDefs[cName]) throw new Error(`component:${name} child component ${cName} is not registered`);
        return new instance.SafeString(cDefs[cName].instance(props).render());
      });

      // add component helpers
      Object.entries(helpers).forEach(([name, fn]) => instance.registerHelper(name, fn));
      // add ref helper
      instance.registerHelper("ref", key => new instance.SafeString(`data-rbs-ref="${key}"`));
      // watch helpers and debug
      instance.registerHelper("debug", function(obj, { data }) {
        const render = () =>
          `<pre class="debug">${JSON.stringify(
          obj,
          (key, val) => (typeof val === "function" ? val + "" : val),
          2
        )}</pre>`;
        const eId = _watch(_getPath(obj), render, data);
        return new instance.SafeString(Utils.wrapWatcher(eId, render()));
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

  function register(
    appId,
    Handlebars,
    { name, template, data, helpers = {}, hooks = {}, methods = {}, watchers = {}, components = [] }
  ) {
    const appStore = Utils.getStorage(appId);

    data =
      data ||
      function() {
        return {};
      };

    if (!name) Msg.fail("noName", { def: arguments[2] });
    if (typeof data !== "function") Msg.fail("dataFn", { name });
    if (typeof template !== "string") Msg.fail("tmplStr", { name });

    const instance = Handlebars.create();
    const templateFn = instance.compile(template);

    components.forEach(def => {
      if (!def.name) Msg.fail("noName", { def });
      if (!appStore.cDefs[def.name]) appStore.cDefs[def.name] = register(appId, Handlebars, def);
    });

    Helpers.register(appId, { instance, methods, helpers, name, components });

    return {
      instance($props = {}) {
        const compId = Utils.randomId();
        const scope = { $props, methods, hooks, name, watchers, data: data(), $refs: () => Utils.findRefs(compId) };

        scope.methods = Utils.bindAll(scope, methods);
        scope.watchers = Utils.bindAll(scope, watchers);

        // validate the props, add the passed methods after you bind them or you will loose scope
        Object.entries($props).forEach(([key, value]) => {
          if (value === undefined) Msg.warn("propUndef", { name, key });
          if (key in scope.data) Msg.warn("propStomp", { name, key });
          if (typeof value === "function") {
            scope.methods[key] = value;
            delete $props[key];
          }
        });

        appStore.inst[compId] = {
          scope,
          renders: {},
        };

        if (hooks.created) hooks.created.call(scope);

        const proxyInst = ProxyTrap.create({ ...scope, ...{ appId, compId } });
        scope.data = proxyInst.data;

        return {
          ...scope,
          ...{ proxyInst },
          render() {
            const html = Utils.tagComponent(compId, templateFn(scope.data), name);
            proxyInst.watch();
            return html;
          },
        };
      },
    };
  }

  var Component = {
    register,
  };

  let debugEnabled = false;

  var index = {
    app({ $el, root, Handlebars = window.Handlebars, trace = false }) {
      if (!Handlebars) Msg.fail("noHbs");

      window.rbs = window.ReBars = window.ReBars || {};
      window.ReBars.apps = window.ReBars.apps || {};
      window.ReBars.handlers = window.ReBars.handlers || {
        trigger(...args) {
          const [appId, cId, methodName, ...params] = args;
          const scope = Utils.getStorage(appId, cId).scope;
          const method = scope.methods[methodName];
          if (!method) Msg.fail("noMethod", { name: scope.name, methodName });
          method(...params);
        },

        bound(appId, cId, event, path) {
          const scope = Utils.getStorage(appId, cId).scope;
          Utils.setKey(scope.data, path, event.target.value);
        },
      };

      const id = Utils.randomId();
      const storage = (window.ReBars.apps[id] = { cDefs: {}, inst: {}, trace });

      if (!document.body.contains($el)) Msg.fail("noEl");

      $el.innerHTML = Component.register(id, Handlebars, root)
        .instance()
        .render();

      return {
        id,
        storage,
      };
    },

    debug: {
      get() {
        return debugEnabled;
      },
      set(val) {
        debugEnabled = val;
      },
    },
  };

  return index;

})));
