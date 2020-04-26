const styles = {
  warn: "background: #484915; color: #ffffbe; padding: .1em; font-weight: normal;",
  log: "background: #324645; color:#c9faff; padding: .1em; font-weight: normal;",
};

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
    if (!window.ReBars || !window.ReBars.trace) return;
    if (payloads) {
      console.groupCollapsed(str, styles[type]);
      payloads.forEach(p => console.log(p));
      console.groupEnd();
    } else {
      console.log(str, styles[type]);
    }
  } else {
    payloads.forEach(p => console.error(p));
    throw new Error(str);
  }
};

const messages = {
  noEl: () => "$el must be present in the document",
  noHbs: () => "ReBars need Handlebars in order to run!",
  noName: () => "Each ReBars component should have a name",
  dataFn: ({ name }) => `${name}: must be a function`,
  tplStr: ({ name }) => `${name}: needs a template string`,
  propStomp: ({ name, key }) => `${name}: "data.${key}" was overrode by a prop`,
  propUndef: ({ name, key }) => `${name}: was passed undefined for prop "${key}"`,
  oneRoot: ({ name }) =>
    `${name}: must have one root node, and cannot be a {{#watch}} block. \nThis error can also be caused by malformed html.`,
  badPath: ({ path }) => `${path} was not found in object`,
  reRender: ({ name, path }) => `${name}: re-rendering "${path}"`,
  patching: ({ name, path }) => `${name}: patching ref Array "${path}"`,
  pathTrigger: ({ path, action, name }) => `${name}: ${action} "${path}"`,
  triggered: ({ name, paths }) => `${name}: data change "${paths}"`,

  noMethod({ name, methodName, template, loc, data }) {
    return `${name}: does not have a method named "${methodName}" ${_getTplString(template, { data, loc })}`;
  },

  paramUndef({ data, template, loc }) {
    return `component:${data.root.$name} passed undefined to a helper
      ${_getTplString(template, { data, loc })}
    `;
  },

  noComp({ data, loc, template, cName }) {
    return `${data.root.$name}: child component "${cName}" is not registered
      ${_getTplString(template, { data, loc })}
    `;
  },
  restrictedKey: ({ name, key }) => `${name}: cannot use restricted key "${key}" in your data as it's a helper`,
  focusFail: ({ ref, name }) =>
    `${name}: ref "${ref}" is used more than once. Focus cannot be restored. If using bind, add a ref="uniqeName" to each`,
  notKeyed: ({ name, path }) =>
    `${name}: patching "${path}" add a {{ref 'someUniqueKey' }} to avoid re-rendering the entire Array`,
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

  findRef: ($target, ref) => {
    if ($target.getAttribute("ref") === ref) return $target;
    return $target.querySelector(`[ref="${ref}"]`);
  },

  findRefs(cId) {
    const $root = this.findComponent(cId);
    const $refs = Array.from($root.querySelectorAll("[ref]"));
    if ($root.getAttribute("ref")) $refs.push($root);

    return $refs.reduce((obj, $el) => {
      const key = $el.getAttribute("ref");
      const target = obj[key];
      obj[key] = target ? [target].concat($el) : $el;
      return obj;
    }, {});
  },

  findWatcher: id => document.querySelector(`[data-rbs-watch="${id}"]`),

  propStr: props =>
    Object.entries(props)
      .map(([key, val]) => `${key}="${val}"`)
      .join(" "),

  wrapWatcher(id, html, hash) {
    const { tag, ...props } = { ...{ tag: "span" }, ...hash };
    const propStr = this.propStr(props);
    const style = !html.length ? "style='display:none;'" : "";
    return `<${tag} ${propStr} ${style} data-rbs-watch="${id}">${html}</${tag}>`;
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

  stringify(obj, indent = 2) {
    const parser = (key, val) => (typeof val === "function" ? val + "" : val);
    return JSON.stringify(obj, parser, indent);
  },

  debounce(callback, wait = 0, immediate = false) {
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

// import ReRender from "./re-render.js";

var ProxyTrap = {
  create(data, callback) {
    let que = [];

    const _debounced = Utils.debounce(() => {
      callback(que);
      que = [];
    });

    const _addToQue = path => {
      que.push(path);
      _debounced(que);
    };

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

          _addToQue(path);
          return ret;
        },

        deleteProperty: function(target, prop) {
          const ret = Reflect.deleteProperty(...arguments);
          const path = tree.concat(prop).join(".");

          _addToQue(path);
          return ret;
        },
      });
    }

    const proxyData = _buildProxy(data);
    return proxyData;
  },
};

var Helpers = {
  register({ app, instance, components, helpers, template, methods, name }) {
    Object.entries(helpers).forEach(([name, fn]) => instance.registerHelper(name, fn));
    instance.registerHelper("isComponent", cName => Object.keys(components).includes(cName));

    instance.registerHelper("component", function(...args) {
      const { hash: props, data, loc } = args.pop();
      const cName = args[0];
      if (!components[cName]) Msg.fail("noComp", { data, loc, template, cName });
      return new instance.SafeString(components[cName].instance(props).render());
    });

    instance.registerHelper("debug", (obj, { hash, data, loc }) => {
      if (obj === undefined) Msg.fail("paramUndef", { template, data, loc });
      return new instance.SafeString(`<pre class="debug" ${Utils.dom.propStr(hash)}>${Utils.stringify(obj)}</pre>`);
    });

    instance.registerHelper("watch", function(...args) {
      const { fn, hash, data, loc } = args.pop();
      const instId = data.root.$_componentId;

      const eId = Utils.randomId();

      const _getPath = (target, wildcard = true) => {
        if (target === undefined) Msg.fail("paramUndef", { template, loc, data });
        return typeof target === "object" ? `${target.ReBarsPath}${wildcard ? ".*" : ""}` : target;
      };

      const path = args
        .map(arg => _getPath(arg, false))
        .join(".")
        .split(",");

      const renders = app.components.instances[instId].renders;

      renders[eId] = {
        path,
        render: () => fn(this),
      };

      return Utils.dom.wrapWatcher(eId, fn(this), hash);
    });

    instance.registerHelper("method", function() {
      const [str, ...args] = arguments;
      const [methodName, type = "click"] = str.split(":");
      const { data, loc } = args.pop();

      if (!(methodName in methods)) Msg.fail("noMethod", { name, methodName, template, data, loc });

      const props = { "data-rbs-method": [data.root.$_componentId, type, methodName] };
      if (args && args.length) props["data-rbs-method"] = props["data-rbs-method"].concat(args);
      return new instance.SafeString(Utils.dom.propStr(props));
    });

    instance.registerHelper("bound", (path, { hash = {}, data, loc }) => {
      const { $_componentId } = data.root;
      const params = [$_componentId, path];
      let value;

      try {
        value = !path.includes(".")
          ? data.root[path]
          : path.split(".").reduce((pointer, seg) => pointer[seg], data.root);
      } catch (err) {
        Msg.fail("badPath", { path });
      }

      const props = {
        value,
        ref: hash.ref || path,
        "data-rbs-bound": params,
      };

      return new instance.SafeString(Utils.dom.propStr(props));
    });
  },
};

function _isEqHtml(html1, html2) {
  const reg = new RegExp(/data-rbs(.*?)="(.*?)"/g);
  return html1.replace(reg, "") === html2.replace(reg, "");
}

function _insertAt($target, $child, index = 0) {
  if (index >= $target.children.length) $target.appendChild($child);
  else $target.insertBefore($child, $target.children[index]);
}

var Patch = {
  canPatch: $target => $target.children.length && Array.from($target.children).every($el => $el.getAttribute("ref")),
  hasChanged: ($target, html) => !_isEqHtml($target.innerHTML, html),

  compare({ app, $target, html }) {
    const $shadow = Utils.dom.getShadow(html);
    const $vChilds = Array.from($shadow.children);

    // deletes and updates
    Array.from($target.children).forEach($r => {
      const $v = Utils.dom.findRef($shadow, $r.getAttribute("ref"));
      if (!$v) $r.remove();
      else if (!_isEqHtml($v.innerHTML, $r.innerHTML)) $r.replaceWith($v.cloneNode(true));
    });

    // additions
    $vChilds.forEach(($v, index) => {
      const $r = Utils.dom.findRef($target, $v.getAttribute("ref"));
      if (!$r) _insertAt($target, $v.cloneNode(true), index);
    });

    // sorting
    $vChilds.forEach(($v, index) => {
      const $r = $target.children[index];
      if ($r.getAttribute("ref") !== $v.getAttribute("ref")) $r.replaceWith($v.cloneNode(true));
    });
  },
};

var ReRender = {
  paths({ app, paths, renders, name }) {
    Object.entries(renders)
      .filter(([renderId, handler]) => {
        const matches = paths.some(path => Utils.shouldRender(path, handler.path));
        return matches && Utils.dom.findWatcher(renderId);
      })
      .forEach(([renderId, handler]) => {
        const $target = Utils.dom.findWatcher(renderId);
        const html = handler.render();

        if (!Patch.hasChanged($target, html)) return;

        if (Patch.canPatch($target)) {
          Patch.compare({ app, $target, html });
          Msg.log("patching", { name, path: handler.path }, $target);
          return;
        }

        // warn for not having a ref on array update
        const lenPath = handler.path.find(path => path.endsWith(".length"));
        if (lenPath) Msg.warn("notKeyed", { name, path: lenPath }, $target);

        const activeRef = {
          ref: document.activeElement.getAttribute("ref"),
          pos: document.activeElement.selectionStart,
        };

        $target.style.display = html === "" ? "none" : "";
        $target.innerHTML = html;

        Utils.dom.restoreCursor($target, activeRef);
        Msg.log("reRender", { name, path: handler.path }, $target);
      });

    app.deleteOrphans();
  },
};

const restricted = ["component", "ref", "debug", "isComponent", "method", "bound", "watch", "isComponent"];

function register(
  { id: appId, Handlebars, trace, helpers: globalHelpers, components: globalComponents },
  { name, template, data = () => ({}), helpers = {}, hooks = {}, methods = {}, watchers = {}, components = [] }
) {
  // should prob init Msg with the trace per app
  if (!name) Msg.fail("noName", null, arguments[1]);
  if (typeof data !== "function") Msg.fail("dataFn", { name });
  if (typeof template !== "string") Msg.fail("tmplStr", { name });

  const app = arguments[0];
  const instance = Handlebars.create();
  const templateFn = instance.compile(template);

  const regComps = components.reduce(
    (regs, def) => {
      const reg = register(app, def);
      regs[def.name] = reg;
      return regs;
    },
    { ...globalComponents.registered }
  );

  Object.keys(data()).forEach(key => {
    if (restricted.concat(Object.keys(helpers)).includes(key)) Msg.fail("restrictedKey", { name, key });
  });

  Helpers.register({
    app,
    methods,
    instance,
    name,
    helpers: { ...helpers, ...globalHelpers },
    components: regComps,
    template,
  });

  return {
    instance($props = {}) {
      const id = Utils.randomId();
      const instData = data();
      const renders = {};
      // validate the props, add the passed methods after you bind them or you will loose scope
      Object.entries($props).forEach(([key, value]) => {
        if (value === undefined) Msg.warn("propUndef", { name, key });
      });

      const scope = ProxyTrap.create(
        {
          ...instData,
          ...{
            $props,
            $methods: methods,
            $name: name,
            $_componentId: id,
            $el: () => Utils.dom.findComponent(id),
            $refs: () => Utils.dom.findRefs(id),
          },
        },
        paths => {
          Msg.log("triggered", { name, paths }, renders);
          ReRender.paths({ app, paths, renders, name });
        }
      );

      if (hooks.created) hooks.created.call(scope);

      const compInst = {
        id,
        scope,
        hooks,
        renders,
        handlers: {
          bound(event) {
            const [id, path] = event.target.dataset.rbsBound.split(",");
            Utils.setKey(scope, path, event.target.value);
          },
          method(event) {
            const [id, type, method, ...args] = event.target.dataset.rbsMethod.split(",");
            scope.$methods[method](event, ...args);
          },
        },
        detached() {
          if (hooks.detached) hooks.detached.call(scope);
        },
        attached() {
          if (hooks.attached) hooks.attached.call(scope);
        },
        render() {
          return Utils.dom.tagComponent(id, templateFn(scope), name);
        },
      };

      app.components.instances[id] = compInst;
      return compInst;
    },
  };
}

var Component = {
  register,
};

var index = {
  app({ $el, root, Handlebars = window.Handlebars, helpers = {}, components = [], trace = false }) {
    if (!Handlebars) Msg.fail("noHbs");
    if (!document.body.contains($el)) Msg.fail("noEl");

    const app = {
      id: Utils.randomId(),
      Handlebars,
      trace,
      listening: true,
      helpers,
      $el,
      // needs debounced to make sure we are all done
      deleteOrphans: Utils.debounce(() => {
        Object.keys(app.components.instances).forEach(id => {
          if (!Utils.dom.findComponent(id)) delete app.components.instances[id];
        });
      }),

      components: {
        registered: {},
        instances: {},
      },
    };

    app.components.registered = components.reduce((regs, def) => {
      regs[def.name] = Component.register(app, def);
      return regs;
    }, {});

    function _comp(action, $el) {
      const method = action === "add" ? "attached" : "detached";
      const cId = $el.dataset.rbsComp;
      app.components.instances[cId][method]();
    }
    function _method(action, $method) {
      const method = action === "add" ? "addEventListener" : "removeEventListener";
      const [cId, type] = $method.dataset.rbsMethod.split(",");
      $method[method](type, app.components.instances[cId].handlers.method);
    }
    function _bound(action, $bound) {
      const method = action === "add" ? "addEventListener" : "removeEventListener";
      const [cId, path] = $bound.dataset.rbsBound.split(",");
      $bound[method]("input", app.components.instances[cId].handlers.bound);
    }

    const observer = new MutationObserver(mutationList => {
      mutationList.forEach(({ addedNodes, removedNodes }) => {
        addedNodes.forEach($node => {
          if ($node.nodeType === Node.TEXT_NODE) return;

          if ($node.dataset.rbsComp) _comp("add", $node);
          if ($node.dataset.rbsMethod) _method("add", $node);
          if ($node.dataset.rbsBound) _bound("add", $node);

          $node.querySelectorAll("[data-rbs-comp]").forEach(_comp.bind(null, "add"));
          $node.querySelectorAll("[data-rbs-method]").forEach(_method.bind(null, "add"));
          $node.querySelectorAll("[data-rbs-bound]").forEach(_bound.bind(null, "add"));
        });

        removedNodes.forEach($node => {
          if ($node.nodeType === Node.TEXT_NODE) return;

          if ($node.dataset.rbsMethod) _method("remove", $node);
          if ($node.dataset.rbsBound) _bound("remove", $node);
          if ($node.dataset.rbsComp) _comp("remove", $node);

          $node.querySelectorAll("[data-rbs-method]").forEach(_method.bind(null, "remove"));
          $node.querySelectorAll("[data-rbs-bound]").forEach(_bound.bind(null, "remove"));
          $node.querySelectorAll("[data-rbs-comp]").forEach(_comp.bind(null, "remove"));
        });
      });
    });

    observer.observe($el, {
      childList: true,
      attributes: true,
      subtree: true,
    });

    $el.innerHTML = Component.register(app, root)
      .instance()
      .render();
    return app;
  },
};

export default index;
