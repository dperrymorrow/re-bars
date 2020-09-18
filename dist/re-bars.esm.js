let isTracing = false;

var Config = {
  logLevel: () => (isTracing ? 1 : 0),
  setTrace: val => (isTracing = val),

  regex: {
    attrs: /rbs-(.*?)="(.*?)"/g,
    whitespace: /\s/g,
  },

  attrs: {
    key: "rbs-key",
    watch: "rbs-watch",
    method: "rbs-method",
    ref: "rbs-ref",
  },
};

const { attrs } = Config;

var Dom = {
  recordState($target) {
    const $active = document.activeElement;
    const ref = $active.getAttribute(attrs.ref);

    if (!$target.contains($active) || !ref) return null;
    return {
      ref,
      style: $active.getAttribute("style"),
      scrollTop: $active.scrollTop,
      scrollLeft: $active.scrollLeft,
      selectionStart: $active.selectionStart,
    };
  },

  restoreState($target, activeRef) {
    if (!activeRef) return;

    const $input = this.findAttr(attrs.ref, activeRef.ref, $target);
    if (!$input) return;

    $input.focus();
    if (activeRef.selectionStart) {
      const pos = $input.tagName === "TEXTAREA" ? activeRef.selectionStart : activeRef.selectionStart + 1;
      $input.setSelectionRange(pos, pos);
    }

    $input.scrollTop = activeRef.scrollTop;
    $input.scrollLeft = activeRef.scrollLeft;
    if (activeRef.style) $input.setAttribute("style", activeRef.style);
  },

  findRefs($root) {
    const { ref } = attrs;
    const $refs = Array.from($root.querySelectorAll(`[${ref}]`));

    return $refs.reduce((obj, $el) => {
      const key = $el.getAttribute(ref);
      const target = obj[key];
      obj[key] = target ? [target].concat($el) : $el;
      return obj;
    }, {});
  },

  // use this in place of all the others that are repeated eventually...
  findAttr(attr, val, $target = null) {
    const $container = $target || document;
    // check top level
    if ($target && $target.getAttribute(attr) === val) return $target;
    return $container.querySelector(`[${attr}="${val}"]`);
  },

  findMethod: id => document.querySelector(`[${attrs.method}="${id}"]`),
  findWatcher: id => document.querySelector(`[${attrs.watch}="${id}"]`),
  isTextNode: $el => $el.nodeType === Node.TEXT_NODE,

  propStr: props =>
    Object.entries(props)
      .map(([key, val]) => {
        if (typeof val === "number") return `${key}=${val}`;
        else return `${key}="${val}"`;
      })
      .join(" "),

  wrapWatcher(id, html, hash) {
    const { tag, ...props } = { tag: "span", ...hash };
    const propStr = this.propStr(props);
    const style = !html.length ? "style='display:none;'" : "";
    return `<${tag} ${propStr} ${style} ${attrs.watch}="${id}">${html}</${tag}>`;
  },

  getShadow(html) {
    const $tmp = document.createElement("div");
    $tmp.innerHTML = html;
    return $tmp;
  },
};

const { fetch } = window;
let counter = 1;

var Utils = {
  dom: Dom,

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

  loadTemplate: file =>
    fetch(file)
      .then(res => res.text())
      .catch(err => {
        throw new Error(err);
      }),

  nextTick: () =>
    new Promise(resolve => {
      setTimeout(resolve, 0);
    }),

  setPath(target, path, val) {
    const segs = path.split(".");
    const last = segs.pop();
    segs.reduce((point, seg) => point[seg], target)[last] = val;
    return target;
  },

  buildContext(scope, { $app, data, methods }) {
    const context = {
      $app,
      $nextTick: this.nextTick,
      $refs: this.dom.findRefs.bind(null, $app),
      rootData: data,
    };
    context.methods = this.bind(methods, scope, context);
    return context;
  },

  registerHelpers({ instance, helpers, scope }) {
    const utils = this;
    Object.entries(helpers).forEach(([name, fn]) =>
      instance.registerHelper(name, function(...args) {
        const context = utils.buildContext(this, scope);
        return fn.call(this, context, ...args);
      })
    );
  },

  bind(obj, scope, ...args) {
    return Object.keys(obj).reduce((bound, key) => {
      bound[key] = obj[key].bind(scope, ...args);
      return bound;
    }, {});
  },

  shouldRender: (changed, watching) => changed.some(change => watching.some(watch => change.match(watch))),
  randomId: () => counter++,
};

var ProxyTrap = {
  create(scope, callback, trackGet = false) {
    let que = [];

    const _debounced = Utils.debounce(() => {
      callback(que);
      que = [];
    });

    const _addToQue = path => {
      if (!que.includes(path)) que.push(path);
      _debounced(que);
    };

    function _buildProxy(raw, tree = []) {
      return new Proxy(raw, {
        get: function(target, prop) {
          const value = Reflect.get(...arguments);

          if (typeof value === "function" && target.hasOwnProperty(prop))
            return value.bind(proxyData, Utils.buildContext(target, scope));

          if (value && typeof value === "object" && ["Array", "Object"].includes(value.constructor.name)) {
            return _buildProxy(value, tree.concat(prop));
          } else {
            if (trackGet) _addToQue(tree.concat(prop).join("."));
            return value;
          }
        },

        set: function(target, prop, value) {
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

    const proxyData = _buildProxy(scope.data);
    return proxyData;
  },
};

const { attrs: attrs$1 } = Config;

var Helpers = {
  register({ instance, template, store, scope }) {
    instance.registerHelper("key", name => new instance.SafeString(`${attrs$1.key}="${name}"`));
    instance.registerHelper("ref", name => new instance.SafeString(`${attrs$1.ref}="${name}"`));

    instance.registerHelper("onlyIf", function(...args) {
      args.pop();
      const [condition, string] = args;
      return new instance.SafeString(condition ? string : "");
    });

    instance.registerHelper("concat", function(...args) {
      args.pop();
      return new instance.SafeString(args.join(""));
    });

    instance.registerHelper("on", function(...args) {
      const { hash } = args.pop();
      const id = Utils.randomId();
      const tplScope = this;

      store.handlers[id] = [];

      Utils.nextTick().then(function() {
        const $el = Utils.dom.findMethod(id);
        if (!$el) return;

        Object.entries(hash).forEach(([eventType, methodName]) => {
          if (!(methodName in scope.methods)) instance.log(3, `ReBars: "${methodName}" is not a method.`, hash, $el);

          const handler = event => {
            const context = Utils.buildContext(tplScope, scope);
            context.event = event;
            context.methods[methodName](...args);
          };

          store.handlers[id].push({ $el, handler, eventType });
          $el.addEventListener(eventType, handler);
        });
      });

      return new instance.SafeString(`${attrs$1.method}="${id}"`);
    });

    instance.registerHelper("bind", function(...args) {
      const { hash } = args.pop();
      const [forceValue] = args;
      const tplScope = this;
      const id = Utils.randomId();

      store.handlers[id] = [];

      Utils.nextTick().then(() => {
        const $el = Utils.dom.findMethod(id);
        if (!$el) return;

        Object.entries(hash).forEach(([eventType, path]) => {
          function handler(event) {
            let value = event.target.value;
            value = value === "" ? null : value;

            try {
              Utils.setPath(tplScope, path, forceValue || value);
            } catch (err) {
              instance.log(3, `ReBars: could not set path ${path}`, $el);
            }
          }
          store.handlers[id].push({ $el, handler, eventType });
          $el.addEventListener(eventType, handler);
        });
      });

      return new instance.SafeString(`${attrs$1.method}="${id}"`);
    });

    instance.registerHelper("watch", function(...args) {
      const { fn, hash } = args.pop();
      const eId = Utils.randomId();

      const ref = {
        path: args.filter(arg => typeof arg === "string"),
        render: () => fn(this),
      };

      if (!args.length) {
        const trap = ProxyTrap.create(
          { ...scope, data: this },
          paths => {
            ref.path = paths;
          },
          true
        );

        fn(trap);
      }

      Utils.nextTick().then(() => {
        const $el = Utils.dom.findWatcher(eId);
        if (!$el) return;

        store.renders[eId] = { ...ref, $el };

        args.forEach(path => {
          if (typeof path !== "string") instance.log(3, "ReBars: can only watch Strings", args, $el);
        });
        instance.log(Config.logLevel(), "ReBars: watching", ref.path, $el);
      });

      return Utils.dom.wrapWatcher(eId, fn(this), hash);
    });
  },
};

const { attrs: attrs$2, regex } = Config;

function _isEqHtml(html1, html2) {
  const parsed1 = html1.replace(regex.attrs, "");
  const parsed2 = html2.replace(regex.attrs, "");
  return Utils.dom.getShadow(parsed1).isEqualNode(Utils.dom.getShadow(parsed2));
}

var Patch = {
  canPatch: $target =>
    $target.children.length &&
    $target.children.length > 1 &&
    Array.from($target.children).every($el => $el.getAttribute(attrs$2.key)),

  hasChanged: ($target, html) => !_isEqHtml($target.innerHTML, html),

  compare({ $target, html, instance, store }) {
    const $shadow = Utils.dom.getShadow(html);
    const $vChilds = Array.from($shadow.children);
    const level = Config.logLevel();

    // deletes and updates
    Array.from($target.children).forEach($r => {
      // warn with the real element if we have an undefined key
      if ($r.getAttribute(attrs$2.key) === "undefined") instance.log(3, "ReBars: key was undefined", $r);

      const $v = Utils.dom.findAttr(attrs$2.key, $r.getAttribute(attrs$2.key), $shadow);
      if (!$v) {
        instance.log(level, "ReBars: removing", $r);
        $r.remove();
      } else if (!_isEqHtml($v.innerHTML, $r.innerHTML)) {
        instance.log(level, "ReBars: updating", $r, $v);
        $r.replaceWith($v.cloneNode(true));
      }
    });

    // additions
    $vChilds.forEach(($v, index) => {
      const $r = Utils.dom.findAttr(attrs$2.key, $v.getAttribute(attrs$2.key), $target);
      if (!$r) {
        instance.log(level, "ReBars: adding", $v);
        $target.append($v.cloneNode(true));
      }
    });

    // sorting
    $vChilds.forEach(($v, index) => {
      const $r = $target.children[index];
      if ($r.getAttribute(attrs$2.key) !== $v.getAttribute(attrs$2.key)) $r.replaceWith($v.cloneNode(true));
    });
  },
};

var ReRender = {
  paths({ changed, store, instance }) {
    Object.entries(store.renders)
      .filter(([renderId, handler]) => {
        return Utils.shouldRender(changed, handler.path) && Utils.dom.findWatcher(renderId);
      })
      .forEach(([renderId, handler]) => {
        const $target = Utils.dom.findWatcher(renderId);
        // if we cant find the target, we should not attempt to re-renders
        if (!$target) return;

        const html = handler.render();
        // cursor position focused element ect...
        const stash = Utils.dom.recordState($target);

        if (!Patch.hasChanged($target, html)) return;

        if (Patch.canPatch($target)) {
          instance.log(Config.logLevel(), "ReBars: patching", handler.path, $target);
          Patch.compare({ $target, html, instance, store });
          Utils.dom.restoreState($target, stash);
          return;
        }

        // we dont want wrappers to show up with no content
        $target.style.display = html === "" ? "none" : "";
        $target.innerHTML = html;
        // restore saved state of DOM
        Utils.dom.restoreState($target, stash);
        instance.log(Config.logLevel(), "ReBars: re-render", handler.path, $target);
      });
  },
};

var Garbage = {
  start($app, { renders, handlers }) {
    const observer = new MutationObserver(([record]) => {
      record.removedNodes.forEach($el => {
        if ($el.nodeType === Node.ELEMENT_NODE) {
          const watchId = $el.getAttribute(Config.attrs.watch);
          const handlerId = $el.getAttribute(Config.attrs.method);
          if (watchId) delete renders[watchId];

          if (handlerId) {
            handlers[handlerId].forEach(item => {
              item.$el.removeEventListener(item.eventType, item.handler);
            });
            delete handlers[handlerId];
          }
        }
      });
    });

    observer.observe($app, { attributes: true, childList: true, subtree: true });
    return observer;
  },
};

const ReBars = {
  load: Utils.loadTemplate,
  app({
    helpers = {},
    template,
    data = {},
    methods = {},
    partials = {},
    watch = {},
    hooks = {},
    Handlebars = window ? window.Handlebars : null,
    trace = false,
  }) {
    if (!Handlebars) throw new Error("ReBars: needs Handlebars in order to run");

    const instance = Handlebars.create();
    const store = { renders: {}, handlers: {} };
    Config.setTrace(trace);

    return {
      store,
      instance,
      async render(selector) {
        // takes an element or a selector
        const $app = selector.nodeType === Node.ELEMENT_NODE ? selector : document.querySelector(selector);

        if (!$app) throw new Error(`ReBars: document.querySelector("${selector}") could not be found on the document`);

        // have to make sure they are resolved first
        await Promise.all(Object.values(partials));
        Object.entries(partials).forEach(async ([name, tpl]) =>
          instance.registerPartial(name, tpl instanceof Promise ? await tpl : tpl)
        );

        // must be compiled after the partials
        const templateFn = instance.compile(template instanceof Promise ? await template : template);

        const scope = {
          $app,
          methods,
          data: typeof data === "function" ? data() : data,
        };

        Utils.registerHelpers({ instance, helpers, scope });
        Helpers.register({ instance, template, store, scope });

        scope.data = ProxyTrap.create(scope, async changed => {
          instance.log(Config.logLevel(), "ReBars: change", changed);
          ReRender.paths({ changed, store, instance });
          // have to wait a tick or anything set by a watch will not catch...
          await Utils.nextTick();
          Object.entries(watch).forEach(([path, fn]) => {
            if (Utils.shouldRender(changed, [path])) fn.call(scope.data, Utils.buildContext(scope.data, scope));
          });
        });

        Garbage.start($app, store);
        const context = Utils.buildContext(scope.data, scope);

        if (hooks.beforeRender) await hooks.beforeRender.call(scope.data, context);
        $app.innerHTML = templateFn(scope.data);
        if (hooks.afterRender) await hooks.afterRender.call(scope.data, context);

        return context;
      },
    };
  },
};

// add it to the window if we have one...
if (window) window.ReBars = window.ReBars || ReBars;

export default ReBars;
