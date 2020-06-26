let isTracing = false;

var Config = {
  logLevel: () => (isTracing ? 1 : 0),
  setTrace: val => (isTracing = val),

  regex: {
    attrs: /rbs-(.*?)="(.*?)"/g,
    whitespace: /\s/g,
  },

  attrs: {
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

  isTextNode: $el => $el.nodeType === Node.TEXT_NODE,

  restoreState($target, activeRef) {
    if (!activeRef) return;

    const $input = this.findRef($target, activeRef.ref);
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

  findRef: ($target, ref) => {
    if ($target.getAttribute(attrs.ref) === ref) return $target;
    return $target.querySelector(`[${attrs.ref}="${ref}"]`);
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

  findMethod: id => document.querySelector(`[${attrs.method}="${id}"]`),
  findWatcher: id => document.querySelector(`[${attrs.watch}="${id}"]`),

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

  nextTick() {
    return new Promise(resolve => {
      setTimeout(resolve, 0);
    });
  },

  intersects: (obj1, obj2) => Object.keys(obj2).filter(key => key in obj1),

  registerHelpers(instance, helpers) {
    Object.entries(helpers).forEach(([name, fn]) => instance.registerHelper(name, fn));
  },

  registerPartials(instance, scope, partials) {
    Object.entries(partials).forEach(([name, partial]) => {
      instance.registerPartial(name, partial.template);

      ["methods", "partials", "data"].forEach(key => {
        if (!(key in partial)) return;
        const collide = this.intersects(scope[key], partial[key]);
        if (collide.length) instance.log(2, `ReBars: partial ${name} has conflicting ${key} keys`, collide);
      });

      if (partial.data) Object.assign(scope.data, partial.data);
      if (partial.methods) Object.assign(scope.methods, partial.methods);
      if (partial.helpers) this.registerHelpers(instance, partial.helpers);
    });
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
  create(data, callback, trackGet = false) {
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

    const proxyData = _buildProxy(data);
    return proxyData;
  },
};

// import Msg from "./msg.js";

const { attrs: attrs$1 } = Config;

var Helpers = {
  register({ instance, template, store, scope }) {
    instance.registerHelper("ref", name => new instance.SafeString(`${attrs$1.ref}="${name}"`));
    instance.registerHelper("buildPath", function(...args) {
      args.pop();
      return Array.from(args).join(".");
    });

    instance.registerHelper("on", function(...args) {
      const { hash } = args.pop();
      const id = Utils.randomId();
      const tplScope = this;

      store.handlers[id] = [];

      Object.entries(hash).forEach(([eventType, methodName]) => {
        // check for method existance

        Utils.nextTick().then(function() {
          const $el = Utils.dom.findMethod(id);
          if (!$el) return;

          if (!(methodName in scope.methods)) instance.log(3, `ReBars: "${methodName}" is not a method.`, hash, $el);

          const handler = event => {
            const context = {
              event,
              $app: scope.$app,
              $refs: Utils.dom.findRefs.bind(null, scope.$app),
              $nextTick: Utils.nextTick,
              rootData: scope.data,
            };

            context.methods = Utils.bind(scope.methods, tplScope, context);
            context.methods[methodName](...args);
          };

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
          this,
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
    Array.from($target.children).every($el => $el.getAttribute(attrs$2.ref)),

  hasChanged: ($target, html) => !_isEqHtml($target.innerHTML, html),

  compare({ $target, html, instance, store }) {
    const $shadow = Utils.dom.getShadow(html);
    const $vChilds = Array.from($shadow.children);
    const level = Config.logLevel();

    // deletes and updates
    Array.from($target.children).forEach($r => {
      const $v = Utils.dom.findRef($shadow, $r.getAttribute(attrs$2.ref));
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
      const $r = Utils.dom.findRef($target, $v.getAttribute(attrs$2.ref));
      if (!$r) {
        instance.log(level, "ReBars: adding", $v);
        $target.append($v.cloneNode(true));
      }
    });

    // sorting
    $vChilds.forEach(($v, index) => {
      const $r = $target.children[index];
      if ($r.getAttribute(attrs$2.ref) !== $v.getAttribute(attrs$2.ref)) $r.replaceWith($v.cloneNode(true));
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
        // this can probally be cleaned up with clearing orphans on the app
        // TODO: this should not be needed if garbage is collected well
        if (!$target) return;

        const html = handler.render();
        const stash = Utils.dom.recordState($target);

        if (!Patch.hasChanged($target, html)) return;

        if (Patch.canPatch($target)) {
          instance.log(Config.logLevel(), "ReBars: patching", handler.path, $target);
          Patch.compare({ $target, html, instance, store });
          Utils.dom.restoreState($target, stash);
          return;
        }

        // warn for not having a ref on array update
        const lenPath = handler.path.find(path => path.endsWith(".length"));
        if (lenPath)
          instance.log(
            2,
            "ReBars: add a {{ ref someUniqueKey }} to each to avoid re-rendering the entire Array",
            handler.path,
            $target
          );

        $target.style.display = html === "" ? "none" : "";
        $target.innerHTML = html;

        Utils.dom.restoreState($target, stash);
        instance.log(Config.logLevel(), "ReBars: render", handler.path, $target);
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

var app = {
  app({
    helpers = {},
    template,
    data = {},
    methods = {},
    partials = {},
    watch = {},
    Handlebars = window.Handlebars,
    trace = false,
  }) {
    const instance = Handlebars.create();
    const templateFn = instance.compile(template);
    const store = { renders: {}, handlers: {} };

    Config.setTrace(trace);
    Utils.registerHelpers(instance, helpers);

    return {
      store,
      instance,
      render(selector) {
        const $app = document.querySelector(selector);

        if (!$app)
          return instance.log(3, `ReBars: document.querySelector("${selector}") could not be found on the document`);

        const scope = {
          $app,
          methods,
          data,
        };

        Helpers.register({ instance, template, store, scope });
        Utils.registerPartials(instance, scope, partials);

        // for the methods
        scope.data = Object.entries(scope.data).reduce((scoped, [key, value]) => {
          if (typeof value === "function" && scoped.hasOwnProperty(key)) scoped[key] = value.bind(scope);
          return scoped;
        }, data);

        scope.data = ProxyTrap.create(data, changed => {
          instance.log(Config.logLevel(), "ReBars: change", changed);
          ReRender.paths({ changed, store, instance });
          Object.entries(watch).forEach(([path, fn]) => {
            if (Utils.shouldRender(changed, [path])) fn.call(scope);
          });
        });

        Garbage.start($app, store);
        $app.innerHTML = templateFn(scope.data);
      },
    };
  },
};

export default app;
