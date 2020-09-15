let isTracing = false;

var Config = {
  logLevel: () => (isTracing ? 1 : 0),
  setTrace: val => (isTracing = val),

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
};

let counter = 1;
const { fetch } = window;

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

// import Msg from "./msg.js";

const { attrs: attrs$1 } = Config;

var Helpers = {
  register({ instance, template, store, scope }) {
    instance.registerHelper("ref", name => new instance.SafeString(`${attrs$1.ref}="${name}"`));

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

    instance.registerHelper("concat", function(...args) {
      args.pop();
      return args.join("");
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
          if (typeof path !== "string")
            instance.log(3, `ReBars: can only watch Strings, ${typeof path} - ${path} given`, args, $el);
        });
      });

      return Utils.dom.wrapWatcher(eId, fn(this), hash);
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
        // cursor position focused element ect...
        const stash = Utils.dom.recordState($target);
        // we dont want wrappers to show up with no content
        $target.style.display = html === "" ? "none" : "";
        $target.innerHTML = html;
        // restore saved state of DOM
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
    const instance = Handlebars.create();

    const store = { renders: {}, handlers: {} };
    if (!Handlebars) throw new Error("ReBars: needs Handlebars in order to run");

    Config.setTrace(trace);

    return {
      store,
      instance,
      async render(selector) {
        const $app = document.querySelector(selector);

        // have to make sure they are resolved first
        await Promise.all(Object.values(partials));
        Object.entries(partials).forEach(async ([name, tpl]) =>
          instance.registerPartial(name, tpl instanceof Promise ? await tpl : tpl)
        );

        // must be compiled after the partials
        const templateFn = instance.compile(template instanceof Promise ? await template : template);

        if (!$app)
          return instance.log(3, `ReBars: document.querySelector("${selector}") could not be found on the document`);

        const scope = {
          $app,
          methods,
          data,
        };

        Utils.registerHelpers({ instance, helpers, scope });
        Helpers.register({ instance, template, store, scope });

        scope.data = ProxyTrap.create(scope, async changed => {
          instance.log(Config.logLevel(), "ReBars: change".blue, changed);
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
      },
    };
  },
};

// add it to the window if we have one...
if (window) window.ReBars = window.ReBars || ReBars;

export default ReBars;
