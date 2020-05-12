const styles = {
  warn: "background: #484915; color: #ffffbe; padding: .1em; font-weight: normal;",
  log: "background: #324645; color:#c9faff; padding: .1em; font-weight: normal;",
};

const _showTpl = ({ template, loc }) => {
  const lines = template.split("\n").slice(loc.start.line - 1, loc.end.line);
  const leadingSpaces = Array(lines[0].length - lines[0].trim().length).join(" ");
  const trimmed = lines.map(line => line.replace(leadingSpaces, "      "));
  trimmed[0] = `>>>> ${trimmed[0].trim()}`;

  return `
  template line: ${loc.start.line}
  ============================================
  ${trimmed.join("\n")}
  `;
};

const _msg = (type, msg, ...payloads) => {
  let str = msg;
  if (typeof payloads[0] === "object" && "template" in payloads[0] && "loc" in payloads[0]) {
    str += _showTpl(payloads[0]);
    payloads.splice(0, 1);
  }

  if (["warn", "log"].includes(type)) {
    str = "%c " + str + " ";
    if (!window.ReBars || !window.ReBars.trace) return;
    if (payloads) {
      console.groupCollapsed(str, styles[type]);
      payloads.forEach(console.log);
      console.groupEnd();
    } else {
      console.log(str, styles[type]);
    }
  } else {
    payloads.forEach(console.error);
    throw new Error(str);
  }
};

var Msg = {
  warn: _msg.bind(null, "warn"),
  fail: _msg.bind(null, "throw"),
  log: _msg.bind(null, "log"),
};

var Dom = {
  tagComponent(id, html, name) {
    const $tmp = this.getShadow(html);
    const $root = $tmp.firstElementChild;

    if (!$root) throw new Error("there was no root node. Components need a root element.");
    if (["P"].includes($root.nodeName))
      Msg.fail(`${name}: <${$root.nodeName.toLowerCase()}> cannot be a root element of for a component, try a <div>`);
    if ($tmp.children.length > 1) Msg.fail(`${name}: multiple root nodes are not allowed for a component.`);
    if ($root.dataset.rbsWatch) Msg.fail(`${name}: cannot have a watch as the root node of a component`);

    $root.dataset.rbsComp = id;
    const content = $tmp.innerHTML;
    return content;
  },

  recordState($target) {
    const $active = document.activeElement;
    const ref = $active.getAttribute("ref");

    if (!$target.contains($active) || !ref) return null;
    return {
      ref,
      scrollTop: $active.scrollTop,
      scrollLeft: $active.scrollLeft,
      selectionStart: $active.selectionStart,
    };
  },

  restoreState($target, activeRef) {
    if (!activeRef) return;

    const $input = this.findRef($target, activeRef.ref);
    if (!$input) return;

    if (Array.isArray($input)) {
      Msg.warn(
        `ref="${activeRef.ref}" is used more than once. Focus cannot be restored. If using bind, add a ref="uniqeName" to each usage`,
        $input
      );
    } else {
      $input.focus();
      if (activeRef.selectionStart) {
        const pos = $input.tagName === "TEXTAREA" ? activeRef.selectionStart : activeRef.selectionStart + 1;
        $input.setSelectionRange(pos, pos);
      }

      $input.scrollTop = activeRef.scrollTop;
      $input.scrollLeft = activeRef.scrollLeft;
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
      .map(([key, val]) => {
        if (typeof val === "number") return `${key}=${val}`;
        else return `${key}="${val}"`;
      })
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

  isProp(target) {
    if (typeof target === "string" && target.startsWith("$props")) return true;
    else if (typeof target === "object" && target.ReBarsPath.startsWith("$props")) return true;
    return false;
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

  getKey(obj, path) {
    return path.split(".").reduce((pointer, key) => {
      if (!(key in pointer)) Msg.fail(`${path} was not found in object`, obj);
      return pointer[key];
    }, obj);
  },

  hasKey(obj, path) {
    // cannot traverse it if wildcards are used
    if (path.includes("*")) return true;
    try {
      this.getKey(obj, path);
      return true;
    } catch (err) {
      return false;
    }
  },

  setKey(obj, path, val) {
    const arr = path.split(".");
    arr.reduce((pointer, key, index) => {
      if (!(key in pointer)) Msg.fail(`${path} was not found in object!`, obj);
      if (index + 1 === arr.length) pointer[key] = val;
      return pointer[key];
    }, obj);
  },
};

var Constants = {
  protectedKeys: ["$_componentId", "$props", "$methods", "$name", "$parent", "$listeners"],
  listenerPrefix: "listen:",
};

var ProxyTrap = {
  create(data, callback, trackGet = false) {
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
          if (typeof value === "function" && target.hasOwnProperty(prop)) return value.bind(proxyData);
          // we dont watch any of the protected items
          if (Constants.protectedKeys.includes(tree[0])) return value;
          else if (trackGet) _addToQue(tree.concat(prop).join("."));
          if (value !== null && typeof value === "object" && prop !== "methods")
            return _buildProxy(value, tree.concat(prop));
          else return value;
        },

        set: function(target, prop) {
          const ret = Reflect.set(...arguments);
          const path = tree.concat(prop).join(".");
          // we dont trigger on protected keys
          if (Constants.protectedKeys.includes(tree[0]))
            Msg.warn(`attempted to set a protected key "${path}". readOnly properties are ${Constants.protectedKeys}`);
          else _addToQue(path);
          return ret;
        },

        deleteProperty: function(target, prop) {
          const ret = Reflect.deleteProperty(...arguments);
          const path = tree.concat(prop).join(".");
          if (Constants.protectedKeys.includes(tree[0]))
            Msg.fail(`cannot delete protected key ${path}. readOnly properties are ${Constants.protectedKeys}`);
          else _addToQue(path);
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
      const { hash, loc, data } = args.pop();

      const cName = args[0];
      if (!components[cName]) Msg.fail(`${name}: child component "${cName}" is not registered`, { template, loc });

      // validate the props, add the passed methods after you bind them or you will loose scope
      Object.entries(hash).forEach(([key, value]) => {
        if (value === undefined) {
          Msg.fail(
            `${name}: passed "${key}" as undefined. If you really meant to, pass null instead.`,
            {
              template,
              loc,
            },
            hash
          );
        }
      });
      // make sure all the listeners are good
      Object.keys(hash)
        .filter(key => key.startsWith(Constants.listenerPrefix))
        .forEach(key => {
          const methodName = hash[key];
          if (!(methodName in data.root.$methods))
            Msg.fail(
              `${name}: listener "${methodName}" was not found in the ${name}'s methods.`,
              { template, loc },
              hash
            );
          else hash[key] = data.root.$methods[methodName];
        });

      return new instance.SafeString(components[cName].instance(hash).render());
    });

    instance.registerHelper("debug", (obj, { hash, data, loc }) => {
      if (obj === undefined) Msg.fail(`${name}: undefined passed to debug`, { template, loc });
      const props = { class: "debug", ...hash };
      return new instance.SafeString(`<pre ${Utils.dom.propStr(props)}>${Utils.stringify(obj)}</pre>`);
    });

    instance.registerHelper("watch", function(...args) {
      const { fn, hash, data, loc } = args.pop();
      const instId = data.root.$_componentId;
      const eId = Utils.randomId();

      const _getPath = target => {
        if (target === undefined) Msg.fail(`${name}: undefined cannot be watched`, { template, loc });

        if (Utils.isProp(target))
          Msg.fail(
            `${name}: Do not watch $props. Each component has its own Proxy so the child will not get the update. Instead watch the item in the parent, and re-render the child component`,
            { template, loc }
          );

        return typeof target === "object" ? `${target.ReBarsPath}.*` : target;
      };

      const path = args.map(_getPath);
      const renders = app.components.instances[instId].renders;

      if (!path.length) {
        const trap = ProxyTrap.create(
          data.root,
          paths => {
            renders[eId].path = paths;
          },
          true
        );

        fn(trap);
      }

      path.forEach(item => {
        if (!Utils.hasKey(data.root, item)) Msg.fail(`${name}: cannot find path "${item}" to watch`, { template, loc });
      });

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

      if (!(methodName in methods) && methodName !== "$emit")
        Msg.fail(`${name}: "${methodName}" is not a method`, { template, loc });

      const props = { "data-rbs-method": [data.root.$_componentId, type, methodName] };
      if (args && args.length) props["data-rbs-method"] = props["data-rbs-method"].concat(args);
      return new instance.SafeString(Utils.dom.propStr(props));
    });

    instance.registerHelper("bound", (path, { hash = {}, data, loc }) => {
      const params = [data.root.$_componentId, path];
      if (!Utils.hasKey(data.root, path)) Msg.fail(`${name}: does not have path "${path}"`, { template, loc });

      const props = {
        value: Utils.getKey(data.root, path),
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
  canPatch: $target =>
    $target.children.length &&
    $target.children.length > 1 &&
    Array.from($target.children).every($el => $el.getAttribute("ref")),
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
        const stash = Utils.dom.recordState($target);

        if (!Patch.hasChanged($target, html)) return;

        if (Patch.canPatch($target)) {
          Patch.compare({ app, $target, html });
          Msg.log(`${name}: patching ${handler.path}`, $target);
          Utils.dom.restoreState($target, stash);
          return;
        }

        // warn for not having a ref on array update
        const lenPath = handler.path.find(path => path.endsWith(".length"));
        if (lenPath)
          Msg.warn(
            `${name}: patching "${handler.path}" add a ref="someUniqueKey" to each to avoid re-rendering the entire Array of elements`,
            $target
          );

        $target.style.display = html === "" ? "none" : "";
        $target.innerHTML = html;

        Utils.dom.restoreState($target, stash);
        Msg.log(`${name}: re-rendering watch block for ${handler.path}`, $target);
      });

    app.deleteOrphans();
  },
};

const restricted = ["component", "ref", "debug", "isComponent", "method", "bound", "watch", "isComponent"];

// too much destructuring making it confusting with colliding names
function register(
  { id: appId, Handlebars, trace, helpers: globalHelpers, components: globalComponents },
  { name, template, data = () => ({}), helpers = {}, hooks = {}, methods = {}, watchers = {}, components = [] }
) {
  const compDef = arguments[0];

  if (!name) Msg.fail("Every ReBars component should have a name!", compDef);
  if (typeof data !== "function") Msg.fail(`${name}: component data must be a function`, compDef);
  if (typeof template !== "string") Msg.fail("`${name}: needs a template string`", compDef);

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
    if (restricted.concat(Object.keys(helpers)).includes(key))
      Msg.fail(`${name}: cannot use "${key}" in your data as it's defined as a helper`, compDef);
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

      const $listeners = Object.entries($props).reduce((listeners, [key, handler]) => {
        if (key.startsWith(Constants.listenerPrefix)) {
          listeners[key.replace(Constants.listenerPrefix, "")] = handler;
          $props[key].delete;
        }
        return listeners;
      }, {});

      let hasCreated = false;

      const scope = ProxyTrap.create(
        {
          ...instData,
          ...{
            $props,
            $methods: methods,
            $listeners,
            $emit: (key, data = {}) => {
              if ($listeners[key]) $listeners[key](data);
            },
            $name: name,
            $_componentId: id,
            $el: () => Utils.dom.findComponent(id),
            $refs: () => Utils.dom.findRefs(id),
          },
        },
        paths => {
          if (!hasCreated) return;
          Msg.log(`${name}: data changed "${paths}"`, renders);
          // watchers...
          Object.entries(watchers)
            .reduce((capture, [key, handler]) => {
              if (paths.some(path => Utils.shouldRender(path, key.split(",")))) capture.push(handler);
              return capture;
            }, [])
            .forEach(handler => handler.call(scope));

          ReRender.paths({ app, paths, renders, name });
        }
      );

      if (hooks.created) hooks.created.call(scope);

      // gotta delay this or it will fire immediately, before the que triggers
      Utils.debounce(() => {
        hasCreated = true;
      })();

      const compInst = {
        id,
        scope,
        hooks,
        renders,
        handlers: {
          bound(event) {
            const [id, path] = event.currentTarget.dataset.rbsBound.split(",");
            Utils.setKey(scope, path, event.target.value);
          },
          method(event) {
            const [id, type, method, ...args] = event.currentTarget.dataset.rbsMethod.split(",");
            if (method === "$emit") scope.$emit(args[0], scope[args[0]]);
            else scope.$methods[method](event, ...args);
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
    if (!document.body.contains($el))
      Msg.fail("$el passed to ReBars app is either undefined or not present in the document.");

    window.ReBars = window.ReBars || {};
    window.ReBars.trace = trace;

    const app = {
      id: Utils.randomId(),
      Handlebars,
      trace,
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
