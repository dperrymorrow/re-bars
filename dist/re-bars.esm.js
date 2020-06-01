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
  // tagComponent(id, html, name) {
  //   const $tmp = this.getShadow(html);
  //   const $root = $tmp.firstElementChild;
  //
  //   if (!$root) throw new Error("there was no root node. Components need a root element.");
  //   if (["P"].includes($root.nodeName))
  //     Msg.fail(`${name}: <${$root.nodeName.toLowerCase()}> cannot be a root element of for a component, try a <div>`);
  //   if ($tmp.children.length > 1) Msg.fail(`${name}: multiple root nodes are not allowed for a component.`);
  //   if ($root.dataset.rbsWatch) Msg.fail(`${name}: cannot have a watch as the root node of a component`);
  //
  //   $root.dataset.rbsComp = id;
  //   const content = $tmp.innerHTML;
  //   return content;
  // },

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

  // findComponent: id => document.querySelector(`[data-rbs-comp="${id}"]`),

  // findRef: ($target, ref) => {
  //   if ($target.getAttribute("ref") === ref) return $target;
  //   return $target.querySelector(`[ref="${ref}"]`);
  // },
  //
  findRefs($root) {
    const $refs = Array.from($root.querySelectorAll("[ref]"));

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

  bind(obj, scope) {
    return Object.keys(obj).reduce(
      (bound, key) => {
        bound[key] = bound[key].bind(scope);
        return bound;
      },
      { ...obj }
    );
  },

  // isProp(target) {
  //   if (typeof target === "string" && target.startsWith("$props")) return true;
  //   else if (typeof target === "object" && target.ReBarsPath && target.ReBarsPath.startsWith("$props")) return true;
  //   return false;
  // },

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
  //
  // setKey(obj, path, val) {
  //   const arr = path.split(".");
  //   arr.reduce((pointer, key, index) => {
  //     if (!(key in pointer)) Msg.fail(`${path} was not found in object!`, obj);
  //     if (index + 1 === arr.length) pointer[key] = val;
  //     return pointer[key];
  //   }, obj);
  // },
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

          if (trackGet) _addToQue(tree.concat(prop).join("."));
          if (value !== null && typeof value === "object" && prop !== "methods" && value.constructor.name === "object")
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
  register({ instance, helpers, template, store }) {
    Object.entries(helpers).forEach(([name, fn]) => instance.registerHelper(name, fn));

    instance.registerHelper("debug", (obj, { hash, data, loc }) => {
      if (obj === undefined) Msg.fail(`${name}: undefined passed to debug`, { template, loc });
      const props = { class: "debug", ...hash };
      return new instance.SafeString(`<pre ${Utils.dom.propStr(props)}>${Utils.stringify(obj)}</pre>`);
    });

    instance.registerHelper("watch", function(...args) {
      const { fn, hash, data, loc } = args.pop();

      const eId = Utils.randomId();

      const _getPath = target => {
        if (target === undefined) Msg.fail(`${name}: undefined cannot be watched`, { template, loc });
        return typeof target === "object" ? `${target.ReBarsPath}.*` : target;
      };

      const path = args.map(_getPath);

      if (!path.length) {
        const trap = ProxyTrap.create(
          data.root,
          paths => {
            store.renders[eId].path = paths;
          },
          true
        );

        fn(trap);
      }

      path.forEach(item => {
        if (!Utils.hasKey(data.root, item)) Msg.fail(`${name}: cannot find path "${item}" to watch`, { template, loc });
      });

      store.renders[eId] = {
        path,
        render: () => fn(this),
      };

      return Utils.dom.wrapWatcher(eId, fn(this), hash);
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
  paths({ paths, renders }) {
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

        // if (Patch.canPatch($target)) {
        //   Patch.compare({ app, $target, html });
        //   Msg.log(`${name}: patching ${handler.path}`, $target);
        //   Utils.dom.restoreState($target, stash);
        //   return;
        // }

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
  },
};

var app = {
  app({ helpers = {}, template, data = {}, refs = {}, methods = {}, Handlebars = window.Handlebars }) {
    const instance = Handlebars.create();
    const templateFn = instance.compile(template);
    const store = { renders: {} };

    const proxy = ProxyTrap.create(data, paths => {
      Msg.log(`${name}: data changed "${paths}"`, store.renders);
      ReRender.paths({ paths, renders: store.renders });
    });

    Helpers.register({ instance, template, helpers, store });

    return {
      instance,
      render($app) {
        const scope = {
          data: proxy,
          methods,
          refs,
          $refs: () => Utils.dom.findRefs($app),
          $app,
        };

        scope.methods = Utils.bind(scope.methods, scope);
        scope.refs = Utils.bind(scope.refs, scope);

        function _checkForMethod($el, status) {
          const method = $el.getAttribute("method");
          if (method) {
            const [eventType, methodName] = method.includes(":") ? method.split(":") : `click:${method}`.split(":");
            if (status === "attached") $el.addEventListener(eventType, scope.methods[methodName]);
            else $el.removeEventListener(eventType, scope.methods[methodName]);
          }
        }

        const observer = new MutationObserver(mutationList => {
          mutationList.forEach(({ addedNodes, removedNodes }) => {
            addedNodes.forEach($node => {
              if ($node.nodeType === Node.TEXT_NODE) return;
              _checkForMethod($node, "attached");
              $node.querySelectorAll("[method]").forEach($node => _checkForMethod($node, "attached"));
            });

            removedNodes.forEach($node => {
              if ($node.nodeType === Node.TEXT_NODE) return;
              _checkForMethod($node, "detached");
              $node.querySelectorAll("[method]").forEach($node => _checkForMethod($node, "detached"));
            });
          });
        });

        observer.observe($app, {
          childList: true,
          attributes: true,
          subtree: true,
        });

        $app.innerHTML = templateFn(proxy);
      },
    };
  },
};

export default app;
