(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.Vbars = factory());
}(this, (function () { 'use strict';

  function buildProxy(raw, callback, tree = []) {
    return new Proxy(raw, {
      get: function(target, prop) {
        const value = Reflect.get(...arguments);
        if (value !== null && typeof value === "object" && prop !== "methods")
          return buildProxy(value, callback, tree.concat(prop));
        else return value;
      },

      set: function(target, prop) {
        const ret = Reflect.set(...arguments);
        callback({ path: tree.concat(prop).join(".") });
        return ret;
      },

      deleteProperty: function(target, prop) {
        const ret = Reflect.deleteProperty(...arguments);
        callback({ path: tree.concat(prop).join(".") });
        return ret;
      },
    });
  }

  var Utils = {
    isKeyedNode($node) {
      if ($node.children.length)
        return Array.from($node.children).every($child => $child.dataset.key);
      return false;
    },

    keyedChildren($node) {
      return Array.from($node.children).filter($e => $e.dataset.key);
    },

    swapNodes($source, $target) {
      const $clone = $source.cloneNode(true);
      $target.parentNode.replaceChild($clone, $target);
      return $clone;
    },

    addChild($container, $child) {
      const $clone = $child.cloneNode(true);
      $container.appendChild($clone);
      return $clone;
    },

    setKey(obj, path, value) {
      const arr = path.split(".");
      arr.reduce((pointer, key, index) => {
        if (!(key in pointer)) throw new Error(`${path} was not found in object`, obj);
        if (index + 1 === arr.length) pointer[key] = value;
        return pointer[key];
      }, obj);
    },
  };

  function EventHandlers({ $root, methods, proxyData }) {
    return {
      add($container) {
        $container.querySelectorAll("[data-vbars-handler]").forEach($el => {
          const [eventStr, ...rest] = JSON.parse($el.dataset.vbarsHandler);
          const [eventType, methodName] = eventStr.split(":");
          let [listener, ...augs] = eventType.split(".");

          if (!(methodName in methods))
            throw new Error(`${methodName} not in event methods`, methods);

          // gonna have to store this to remove them when patching
          $el.addEventListener(listener, event => {
            if (augs.includes("prevent")) {
              event.stopPropagation();
              event.preventDefault();
            }
            methods[methodName]({ event, data: proxyData, $root, $container }, ...rest);
          });
          delete $el.dataset.vbarsHandler;
        });

        $container.querySelectorAll("[data-vbars-bind]").forEach($el => {
          $el.addEventListener("input", $event => {
            Utils.setKey(proxyData, $el.dataset.vbarsBind, $event.currentTarget.value);
          });
        });
      },
    };
  }

  function VDom({ $root, templateFn, proxyData }) {
    const $el = document.createElement("div");
    const Events = EventHandlers(...arguments);
    const render = () => ($el.innerHTML = templateFn(proxyData));

    function replace() {
      render();
      $root.innerHTML = $el.innerHTML;
      Events.add($root);
    }

    function _compareKeys($vNode, $realNode) {
      Utils.keyedChildren($realNode).forEach($e => {
        const $v = $vNode.querySelector(`[data-key="${$e.dataset.key}"]`);
        // has been deleted
        if (!$v) $e.remove();
        else if (!$v.isEqualNode($e)) {
          // needs replaced, has changed
          const $updated = Utils.swapNodes($v, $e);
          Events.add($updated);
        }
      });
      // this is items that were added via push
      Utils.keyedChildren($vNode).forEach($e => {
        const $real = $realNode.querySelector(`[data-key="${$e.dataset.key}"]`);
        if (!$real) {
          const $newNode = Utils.addChild($realNode, $e);
          Events.add($newNode);
        }
      });
    }

    function patch($target, path) {
      render();

      Array.from($el.querySelectorAll("[data-vbars-watch]"))
        .filter($e => path.startsWith($e.dataset.vbarsWatch))
        .forEach($vNode => {
          const $real = $target.querySelector(`[data-vbars-id="${$vNode.dataset.vbarsId}"]`);
          if (Utils.isKeyedNode($vNode)) {
            // console.log(`comparing keyed arrays ${path}`, $vNode);
            _compareKeys($vNode, $real);
          } else {
            // console.log(`patching ${path}`, $vNode);
            Events.add(Utils.swapNodes($vNode, $real));
          }
        });
    }

    return {
      $el,
      render,
      replace,
      patch,
    };
  }

  var Helpers = {
    register(instance) {
      instance.registerHelper("watch", (path, options) => {
        const identifier = `${options.loc.start.column}${options.loc.start.line}${options.loc.end.column}${options.loc.end.line}`;
        return new instance.SafeString(`data-vbars-id="${identifier}" data-vbars-watch="${path}"`);
      });

      instance.registerHelper("handler", function() {
        const args = Array.from(arguments);
        args.splice(-1, 1);
        return new instance.SafeString(`data-vbars-handler='${JSON.stringify(args)}'`);
      });
    },
  };

  var index = {
    create({ template, data: rawData, methods = {} }) {
      let $root, vDom;

      const instance = window.Handlebars.create();
      const proxyData = buildProxy(rawData, ({ path }) => vDom.patch($root, path));
      Helpers.register(instance, proxyData);
      const templateFn = instance.compile(template);

      return {
        instance,
        data: proxyData,
        render($target) {
          $root = $target;
          vDom = VDom({ $root, templateFn, proxyData, methods });
          vDom.replace();
        },
      };
    },
  };

  return index;

})));
