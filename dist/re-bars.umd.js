(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.ReBars = factory());
}(this, (function () { 'use strict';

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
        scrollTop: $active.scrollTop,
        scrollLeft: $active.scrollLeft,
        selectionStart: $active.selectionStart,
      };
    },

    // getMethodArr($el) {
    //   const attr = $el.getAttribute(attrs.method);
    //   return attr ? JSON.parse(attr) : null;
    // },

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
      const { tag, ...props } = { ...{ tag: "span" }, ...hash };
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
  // import Msg from "../msg.js";

  var Utils = {
    dom: Dom,

    // stringify(obj, indent = 2) {
    //   const parser = (key, val) => (typeof val === "function" ? val + "" : val);
    //   return JSON.stringify(obj, parser, indent);
    // },

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

        if (partial.data) Object.assign(partial.data, scope.data);
        if (partial.methods) Object.assign(scope.methods, partial.methods);
        if (partial.helpers) this.registerHelpers(instance, partial.helpers);
      });
    },

    bind(obj, scope, ...args) {
      return Object.keys(obj).reduce(
        (bound, key) => {
          bound[key] = bound[key].bind(scope, ...args);
          return bound;
        },
        { ...obj }
      );
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

    // getKey(obj, path) {
    //   return path.split(".").reduce((pointer, key) => {
    //     if (!(key in pointer)) Msg.fail(`${path} was not found in object`, obj);
    //     return pointer[key];
    //   }, obj);
    // },
    //
    // hasKey(obj, path) {
    //   // cannot traverse it if wildcards are used
    //   if (path.includes("*")) return true;
    //   try {
    //     this.getKey(obj, path);
    //     return true;
    //   } catch (err) {
    //     return false;
    //   }
    // },
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
        if (!que.includes(path)) que.push(path);
        _debounced(que);
      };

      function _buildProxy(raw, tree = []) {
        return new Proxy(raw, {
          get: function(target, prop) {
            if (prop === "ReBarsPath") return tree.join(".");
            const value = Reflect.get(...arguments);

            if (value && typeof value === "object" && ["Array", "Object"].includes(value.constructor.name)) {
              return _buildProxy(value, tree.concat(prop));
            } else {
              if (trackGet) _addToQue(tree.concat(prop).join("."));
              return value;
            }
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
        const { loc } = args.pop();
        const id = Utils.randomId();
        const [eventType, methodName, ...rest] = args;
        const tplScope = this;
        // check for method existance
        if (!(args[1] in scope.methods)) instance.log(3, `ReBars: "${args[1]}" is not a method. line: ${loc.start.line}`);

        Utils.debounce(() => {
          const $el = Utils.dom.findMethod(id);
          if (!$el) return;

          $el.addEventListener(eventType, event => {
            const context = {
              event,
              $app: scope.$app,
              $refs: Utils.dom.findRefs.bind(null, scope.$app),
              rootData: scope.data,
            };

            context.methods = Utils.bind(scope.methods, tplScope, context);
            context.methods[methodName](...rest);
          });
        })();

        return new instance.SafeString(`${attrs$1.method}="${id}"`);
      });

      instance.registerHelper("watch", function(...args) {
        const last = args.pop();
        const { fn, hash, data, loc } = last;

        const eId = Utils.randomId();

        const _getPath = target => {
          if (target === undefined) instance.log(3, "undefined cannot be watched", { template, loc });
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

        // path.forEach(item => {
        //   if (!Utils.hasKey(data.root, item)) {
        //     debugger;
        //     Msg.fail(`cannot find path "${item}" to watch`, { template, loc });
        //   }
        // });

        store.renders[eId] = {
          path,
          render: () => fn(this),
        };

        return Utils.dom.wrapWatcher(eId, fn(this), hash);
      });
    },
  };

  const refAttr = Config.attrs.ref;

  function _isEqHtml(html1, html2) {
    const reg = new RegExp(/rbs-(.*?)="(.*?)"/g);
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
      Array.from($target.children).every($el => $el.getAttribute(refAttr)),
    hasChanged: ($target, html) => !_isEqHtml($target.innerHTML, html),

    compare({ app, $target, html }) {
      const $shadow = Utils.dom.getShadow(html);
      const $vChilds = Array.from($shadow.children);

      // deletes and updates
      Array.from($target.children).forEach($r => {
        const $v = Utils.dom.findRef($shadow, $r.getAttribute(refAttr));
        if (!$v) $r.remove();
        else if (!_isEqHtml($v.innerHTML, $r.innerHTML)) $r.replaceWith($v.cloneNode(true));
      });

      // additions
      $vChilds.forEach(($v, index) => {
        const $r = Utils.dom.findRef($target, $v.getAttribute(refAttr));
        if (!$r) _insertAt($target, $v.cloneNode(true), index);
      });

      // sorting
      $vChilds.forEach(($v, index) => {
        const $r = $target.children[index];
        if ($r.getAttribute("ref") !== $v.getAttribute(refAttr)) $r.replaceWith($v.cloneNode(true));
      });
    },
  };

  var ReRender = {
    paths({ paths, renders, instance }) {
      Object.entries(renders)
        .filter(([renderId, handler]) => {
          const matches = paths.some(path => Utils.shouldRender(path, handler.path));
          return matches && Utils.dom.findWatcher(renderId);
        })
        .forEach(([renderId, handler]) => {
          const $target = Utils.dom.findWatcher(renderId);
          // if we cant find the target, we should not attempt to re-renders
          // this can probally be cleaned up with clearing orphans on the app

          if (!$target) return;

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
            instance.log(
              2,
              `patching "${handler.path}" add a ref="someUniqueKey" to each to avoid re-rendering the entire Array of elements`,
              $target
            );

          $target.style.display = html === "" ? "none" : "";
          $target.innerHTML = html;

          Utils.dom.restoreState($target, stash);
          instance.log(Config.logLevel(), "ReBars: render", handler.path, $target);
        });
    },
  };

  // import Msg from "./msg.js";

  var app = {
    app({
      helpers = {},
      template,
      data = {},
      refs = {},
      methods = {},
      partials = {},
      Handlebars = window.Handlebars,
      trace = false,
    }) {
      const instance = Handlebars.create();
      const templateFn = instance.compile(template);
      const store = { renders: {} };

      Config.setTrace(trace);
      Utils.registerHelpers(instance, helpers);

      return {
        store,
        instance,
        render($app) {
          const scope = {
            $app,
            methods,
            data,
          };

          // TODO: should be able to await nextRender()

          Helpers.register({ instance, template, store, scope });
          Utils.registerPartials(instance, scope, partials);

          // for the methods
          scope.data = Object.entries(scope.data).reduce((scoped, [key, value]) => {
            if (typeof value === "function" && scoped.hasOwnProperty(key)) scoped[key] = value.bind(scope);
            return scoped;
          }, data);

          scope.data = ProxyTrap.create(data, paths => {
            instance.log(Config.logLevel(), "ReBars: change", paths);
            ReRender.paths({ paths, renders: store.renders, instance });
          });

          const observer = new MutationObserver(mutationList => {
            mutationList.forEach(({ addedNodes, removedNodes }) => {
              removedNodes.forEach($el => {
                if ($el.nodeType === Node.TEXT_NODE) return;
                const watch = $el.getAttribute(Config.attrs.watch);
                if (watch) delete store.renders[watch];
              });
            });
          });

          observer.observe($app, {
            childList: true,
            attributes: true,
            subtree: true,
          });

          $app.innerHTML = templateFn(scope.data);
        },
      };
    },
  };

  return app;

})));
