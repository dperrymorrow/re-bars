const _getTplString = (template, { loc, data }) => {
  const lines = template.split("\n").slice(loc.start.line - 1, loc.end.line);
  const leadingSpaces = Array(lines[0].length - lines[0].trim().length).join(" ");
  lines[0] = lines[0].substr(loc.start.column);
  lines[lines.length - 1] = lines[lines.length - 1].substr(0, loc.end.column);
  return [
    "",
    `component: ${data.root.$name}, template line: ${loc.start.line}`,
    "============================================",
  ]
    .concat(lines.map(line => line.replace(leadingSpaces, "")))
    .join("\n");
};

const _msg = (type, key, obj = {}, ...payloads) => {
  let str = messages[key](obj);

  if (["warn", "log"].includes(type)) {
    str = "%c " + str + " ";
    if (!window.ReBars.trace) return;
    if (payloads) {
      payloads.forEach(p => void 0);
    }
  } else {
    payloads.forEach(p => void 0);
    throw new Error(str);
  }
};

const messages = {
  noEl: () => "$el must be present in the document",
  noHbs: () => "ReBars need Handlebars in order to run!",
  noName: () => "Each ReBars component should have a name",
  dataFn: ({ name }) => `component:${name} must be a function`,
  tplStr: ({ name }) => `component:${name} needs a template string`,
  propStomp: ({ name, key }) => `component:${name} "data.${key}" was overrode by a prop`,
  propUndef: ({ name, key }) => `component:${name} was passed undefined for prop "${key}"`,
  oneRoot: ({ name }) => `component:${name} must have one root node, and cannot be a {{#watch}} block`,
  noMethod: ({ name, methodName }) => `component:${name} does not have a method named "${methodName}"`,
  badPath: ({ path }) => `${path} was not found in object`,
  reRender: ({ name, path }) => `component:${name} re-rendering "${path}"`,
  patching: ({ name, path }) => `component:${name} patching ref Array "${path}"`,
  pathTrigger: ({ path, action, name }) => `component:${name} ${action} "${path}"`,
  triggered: ({ name, paths }) => `component:${name} data change "${paths}"`,

  paramUndef({ data, template, loc }) {
    return `component:${data.root.$name} passed undefined to a helper
      ${_getTplString(template, { data, loc })}
    `;
  },
  badWatchParam({ data, template, loc, path }) {
    return `component:${data.root.$name} could not find "${path}" to watch. If primitve wrap in quotes
      ${_getTplString(template, { data, loc })}
    `;
  },
  noComp({ data, loc, template, cName }) {
    return `component:${data.root.$name} child component "${cName}" is not registered
      ${_getTplString(template, { data, loc })}
    `;
  },
  restrictedKey: ({ name, key }) =>
    `component:${name} cannot use restricted key "${key}" in your data as it's a helper`,
  focusFail: ({ ref, name }) =>
    `component:${name} ref "${ref}" is used more than once. Focus cannot be restored. If using bind, add a ref="uniqeName" to each`,
  notKeyed: ({ name, path }) =>
    `component:${name} patching "${path}" add a {{ ref }} to avoid re-rendering the entire target`,
};

var Msg = {
  messages,
  getStr: (key, obj) => messages[key](obj),
  warn: _msg.bind(null, "warn"),
  fail: _msg.bind(null, "throw"),
  log: _msg.bind(null, "log"),
};

var Dom = {
  tagComponent(id, html, name) {
    const $tmp = this.getShadow(html);
    const $root = $tmp.firstElementChild;

    if (!$root || !$tmp.children || $tmp.children.length > 1 || $root.dataset.rbsWatch)
      Msg.fail("oneRoot", { name }, $tmp);

    $root.dataset.rbsComp = id;
    const content = $tmp.innerHTML;
    $tmp.remove();
    return content;
  },

  restoreCursor($target, activeRef) {
    const $input = this.findRef($target, activeRef.ref);

    if (!$input) return;
    if (Array.isArray($input)) {
      Msg.warn("focusFail", { ref: activeRef.ref, name }, $input);
    } else {
      $input.focus();
      if (activeRef.pos) $input.setSelectionRange(activeRef.pos + 1, activeRef.pos + 1);
    }
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

  findWatcher: id => document.querySelector(`[data-rbs-watch="${id}"]`),

  wrapWatcher: (id, html, hash) => {
    const { tag, ...props } = { ...{ tag: "span", class: "rbs-watch" }, ...hash };
    const propStr = Object.entries(props)
      .map(([key, val]) => `${key}="${val}"`)
      .join(" ");

    const style = !html.length ? "style='display:none;'" : "";
    return `<${tag} ${propStr} ${style} data-rbs-watch="${id}">${html}</${tag}>`;
  },

  isKeyedNode: $target => $target.children.length && Array.from($target.children).every($el => $el.dataset.rbsRef),
  normalizeHtml: html => html.replace(new RegExp(/="rbs(.*?)"/g), ""),

  isEqHtml(item1, item2) {
    const $n1 = typeof item1 === "string" ? this.getShadow(item1) : this.getShadow(item1.innerHTML);
    const $n2 = typeof item2 === "string" ? this.getShadow(item2) : this.getShadow(item2.innerHTML);
    $n1.innerHTML = this.normalizeHtml($n1.innerHTML);
    $n2.innerHTML = this.normalizeHtml($n2.innerHTML);

    return $n1.isEqualNode($n2);
  },

  getShadow(html) {
    const $tmp = document.createElement("div");
    $tmp.innerHTML = html;
    return $tmp;
  },
};

let counter = 1;

var Utils = {
  dom: Dom,

  deleteOrphans(appId, compId) {
    const cStore = this.getStorage(appId, compId);
    const appStore = this.getStorage(appId);

    Object.keys(appStore.inst).forEach(cId => {
      if (!this.dom.findComponent(cId)) delete appStore.inst[cId];
    });
    Object.keys(cStore.renders).forEach(key => {
      if (!this.dom.findWatcher(key)) delete cStore.renders[key];
    });
  },

  debounce(callback, wait, immediate = false) {
    let timeout = null;

    return function() {
      const callNow = immediate && !timeout;
      const next = () => callback.apply(this, arguments);

      clearTimeout(timeout);
      timeout = setTimeout(next, wait);

      if (callNow) {
        next();
      }
    };
  },

  makeParams(args) {
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
  },

  getStorage(appId, cId) {
    return cId
      ? this.findByPath(window.ReBars, `apps.${appId}.inst.${cId}`)
      : this.findByPath(window.ReBars, `apps.${appId}`);
  },

  findByPath: (data, path) => {
    try {
      if (!path.includes(".")) return data[path];
      return path.split(".").reduce((pointer, seg) => pointer[seg], data);
    } catch (err) {
      Msg.fail("badPath", { path }, data);
    }
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

  setKey(obj, path, val) {
    const arr = path.split(".");
    arr.reduce((pointer, key, index) => {
      if (!(key in pointer)) Msg.fail("badPath", { path }, obj);
      if (index + 1 === arr.length) pointer[key] = val;
      return pointer[key];
    }, obj);
  },
};

var ReRender = {
  init(appId, compId) {
    const { scope, renders } = Utils.getStorage(appId, compId);
    const { $name: name } = scope;

    function _patchArr($target, html) {
      const $shadow = Utils.dom.getShadow(html);
      const $vChilds = Array.from($shadow.children);

      // do deletes + changes first so its faster
      Array.from($target.children).forEach($r => {
        const $v = Utils.dom.findRef($shadow, $r.dataset.rbsRef);
        if (!$v) $r.remove();
        else if (!Utils.dom.isEqHtml($v, $r)) $r.replaceWith($v.cloneNode(true));
      });

      // additions;
      $vChilds.forEach(($v, index) => {
        const ref = $v.dataset.rbsRef;
        const $r = Utils.dom.findRef($target, ref);
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

    const triggeredPaths = [];
    const toTrigger = { watchers: {}, renders: {} };

    const _patch = Utils.debounce(() => {
      Msg.log("triggered", { name, paths: triggeredPaths.join(",") }, toTrigger);
      triggeredPaths.length = 0;

      Object.entries(toTrigger.watchers).forEach(([path, fn]) => {
        delete toTrigger.watchers[path];
        fn();
      });

      Object.entries(toTrigger.renders).forEach(([renderId, handler]) => {
        const $target = Utils.dom.findWatcher(renderId);
        if (!$target) return;

        const html = handler.render();

        if (Utils.dom.isEqHtml($target.innerHTML, html)) return;

        if (Utils.dom.isKeyedNode($target)) {
          _patchArr($target, html);
          Msg.log("patching", { name, path: handler.path }, $target);
          delete toTrigger.renders[renderId];
          return;
        }

        const lenPath = handler.matching.find(path => path.endsWith(".length"));
        if (lenPath) Msg.warn("notKeyed", { name, path: lenPath }, $target);

        const activeRef = {
          ref: document.activeElement.dataset.rbsRef,
          pos: document.activeElement.selectionStart,
        };

        $target.style.display = html === "" ? "none" : "";
        $target.innerHTML = html;

        Utils.dom.restoreCursor($target, activeRef);
        Msg.log("reRender", { name, path: handler.path }, $target);
      });
    }, 0);

    return {
      que(path) {
        Utils.deleteOrphans(appId, compId); // narrow down the choices first

        Object.entries(scope.$watchers).forEach(([watchPath, fn]) => {
          if (Utils.shouldRender(path, watchPath)) toTrigger.watchers[watchPath] = fn;
        });

        Object.entries(renders).forEach(([id, handler]) => {
          if (Utils.shouldRender(path, handler.path)) {
            if (!(id in toTrigger.renders)) toTrigger.renders[id] = { ...handler, matching: [path] };
            toTrigger.renders[id].matching.push(path);
          }
        });

        triggeredPaths.push(path);
        _patch();
      },
    };
  },
};

var ProxyTrap = {
  create(data) {
    let que;

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

          if (que) que(path);
          return ret;
        },

        deleteProperty: function(target, prop) {
          const ret = Reflect.deleteProperty(...arguments);
          const path = tree.concat(prop).join(".");

          if (que) que(path);
          return ret;
        },
      });
    }

    const proxyData = _buildProxy(data);
    return {
      watch() {
        que = ReRender.init(proxyData.$_appId, proxyData.$_componentId).que;
      },
      data: proxyData,
    };
  },
};

var Core = {
  register(instance, helpers, template) {
    Object.entries(helpers).forEach(([name, fn]) => instance.registerHelper(name, fn));

    instance.registerHelper("component", function(...args) {
      const { hash: props, data, loc } = args.pop();
      const { cDefs } = Utils.getStorage(data.root.$_appId);

      const cName = args[0];
      if (!cDefs[cName]) Msg.fail("noComp", { data, loc, template, cName });
      return new instance.SafeString(cDefs[cName].instance(props).render());
    });

    instance.registerHelper("isComponent", function(cName, { data }) {
      const { cDefs } = Utils.getStorage(data.root.$_appId);
      return Object.keys(cDefs).includes(cName);
    });

    instance.registerHelper("ref", key => new instance.SafeString(`data-rbs-ref="${key}"`));

    instance.registerHelper("debug", (obj, { data, loc }) => {
      if (obj === undefined) Msg.fail("paramUndef", { template, data, loc });
      const parser = (key, val) => (typeof val === "function" ? val + "" : val);
      return new instance.SafeString(`<pre class="debug">${JSON.stringify(obj, parser, 2)}</pre>`);
    });
  },
};

var Events = {
  register(instance) {
    // events, (just curries to the rbs.handlers)
    instance.registerHelper("method", function() {
      const [str, ...args] = arguments;
      const [methodName, eventType = "click"] = str.split(":");
      const { data } = args.pop();
      const { $_appId, $_componentId } = data.root;
      const params = Utils.makeParams([$_appId, $_componentId, methodName, "[event]"].concat(args));
      return new instance.SafeString(`on${eventType}="rbs.handlers.trigger(${params.join(",")})"`);
    });

    instance.registerHelper("bound", (path, { hash = {}, data }) => {
      const { $_appId, $_componentId } = data.root;
      const val = Utils.findByPath(data.root, path);
      const ref = hash.ref || path;
      const params = Utils.makeParams([$_appId, $_componentId, "[event]", path]);

      return new instance.SafeString(
        `value="${val}" data-rbs-ref="${ref}" oninput="rbs.handlers.bound(${params.join(",")})"`
      );
    });
  },
};

var Watch = {
  register(instance, template) {
    instance.registerHelper("watch", function(...args) {
      const { fn, hash, data, loc } = args.pop();

      const _getPath = (target, wildcard = true) => {
        if (target === undefined) Msg.fail("paramUndef", { template, loc, data });
        return typeof target === "object" ? `${target.ReBarsPath}${wildcard ? ".*" : ""}` : target;
      };

      const path = args
        .map(arg => _getPath(arg, false))
        .join(".")
        .split(",");

      const eId = Utils.randomId();
      const store = Utils.getStorage(data.root.$_appId, data.root.$_componentId);

      store.renders[eId] = {
        path,
        render: () => fn(this),
      };

      return Utils.dom.wrapWatcher(eId, fn(this), hash);
    });
  },
};

const restricted = ["component", "ref", "debug", "isComponent", "method", "bound", "watch", "isComponent"];

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

  if (!name) Msg.fail("noName", null, arguments[2]);
  if (typeof data !== "function") Msg.fail("dataFn", { name });
  if (typeof template !== "string") Msg.fail("tmplStr", { name });

  const instance = Handlebars.create();
  const templateFn = instance.compile(template);

  components.forEach(def => {
    if (!def.name) Msg.fail("noName", null, def);
    if (!appStore.cDefs[def.name]) appStore.cDefs[def.name] = register(appId, Handlebars, def);
  });

  Object.keys(data()).forEach(key => {
    if (restricted.concat(Object.keys(helpers)).includes(key)) Msg.fail("restrictedKey", { name, key });
  });

  Core.register(instance, { ...helpers, ...appStore.helpers }, template);
  Events.register(instance, methods);
  Watch.register(instance, template);

  return {
    instance($props = {}) {
      const compId = Utils.randomId();
      const instData = data();
      // validate the props, add the passed methods after you bind them or you will loose scope
      Object.entries($props).forEach(([key, value]) => {
        if (value === undefined) Msg.warn("propUndef", { name, key });
      });

      const { data: scope, watch } = ProxyTrap.create({
        ...instData,
        ...{
          $props,
          $methods: methods,
          $hooks: hooks,
          $name: name,
          $watchers: watchers,
          $_appId: appId,
          $_componentId: compId,
          $refs: () => Utils.dom.findRefs(compId),
        },
      });

      appStore.inst[compId] = {
        scope,
        renders: {},
      };

      if (hooks.created) hooks.created.call(scope);

      return {
        scope,
        render() {
          const html = Utils.dom.tagComponent(compId, templateFn(scope), name);
          // dont begin watching until after first render
          watch();
          return html;
        },
      };
    },
  };
}

var Component = {
  register,
};

var index = {
  app({ $el, root, Handlebars = window.Handlebars, helpers = {}, trace = false }) {
    window.rbs = window.ReBars = window.ReBars || {};
    window.ReBars.apps = window.ReBars.apps || {};
    window.ReBars.trace = trace;
    window.ReBars.handlers = window.ReBars.handlers || {
      trigger(...args) {
        const [appId, cId, methodName, ...params] = args;
        const scope = Utils.getStorage(appId, cId).scope;
        const method = scope.$methods[methodName];
        if (!method) Msg.fail("noMethod", { name: scope.$name, methodName });
        method(...params);
      },

      bound(appId, cId, event, path) {
        const { scope } = Utils.getStorage(appId, cId);
        Utils.setKey(scope, path, event.target.value);
      },
    };

    if (!Handlebars) Msg.fail("noHbs");
    if (!document.body.contains($el)) Msg.fail("noEl");

    const id = Utils.randomId();
    const storage = (window.ReBars.apps[id] = { helpers, cDefs: {}, inst: {} });

    $el.innerHTML = Component.register(id, Handlebars, root)
      .instance()
      .render();

    return {
      id,
      storage,
    };
  },
};

export default index;
