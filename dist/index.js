(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.Vbars = factory());
}(this, (function () { 'use strict';

  var Utils = {
    isKeyedNode($node) {
      return $node.children.length
        ? Array.from($node.children).every($child => $child.dataset.vbarsKey)
        : false;
    },

    keyedChildren($node) {
      return Array.from($node.children).filter($e => $e.dataset.vbarsKey);
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

  function _parseHandler($el) {
    const { eventType, methodName, args } = JSON.parse($el.dataset.vbarsHandler);
    let [listener, ...augs] = eventType.split(".");
    return { listener, augs, methodName, args };
  }

  function EventHandlers({ $root, methods, proxyData }) {
    function _findHandlers($container, type) {
      const $handlers = $container.querySelectorAll(`[data-vbars-${type.toLowerCase()}]`);
      return $container.dataset[type] ? $handlers.concat($container) : $handlers;
    }

    const _bind = $event =>
      Utils.setKey(proxyData, event.target.dataset.vbarsBind, $event.currentTarget.value);

    function _handler(event) {
      const $el = event.target;
      const { augs, methodName, args } = _parseHandler($el);

      if (augs.includes("prevent")) event.preventDefault();
      if (augs.includes("stop")) event.stopPropagation();

      const $refs = Array.from($root.querySelectorAll("[data-vbars-ref]")).reduce((obj, $el) => {
        obj[$el.dataset.vbarsRef] = $el;
        return obj;
      }, {});

      methods[methodName]({ event, data: proxyData, $root, $refs }, ...args);
    }

    return {
      remove($container) {

        _findHandlers($container, "Handler").forEach($el => {
          const { listener, methodName } = _parseHandler($el);
          $el.removeEventListener(listener, _handler);
        });

        _findHandlers($container, "Bind").forEach($el => {
          $el.removeEventListener("input", _bind);
        });
      },

      add($container) {

        _findHandlers($container, "Handler").forEach($el => {
          const { listener, augs, methodName, args } = _parseHandler($el);
          $el.addEventListener(listener, _handler);
        });

        _findHandlers($container, "Bind").forEach($el => {
          $el.addEventListener("input", _bind);
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

    function _swapNodes($source, $target) {
      const $clone = $source.cloneNode(true);
      Events.remove($target);
      $target.parentNode.replaceChild($clone, $target);
      Events.add($clone);
    }

    function _addChild($container, $child) {
      const $clone = $child.cloneNode(true);
      $container.appendChild($clone);
      Events.add($clone);
    }

    function _compareKeys($vNode, $realNode) {

      Utils.keyedChildren($realNode).forEach($e => {
        const $v = $vNode.querySelector(`[data-vbars-key="${$e.dataset.vbarsKey}"]`);
        if (!$v) {
          Events.remove($e);
          $e.remove();
        } else if (!$v.isEqualNode($e)) {
          _swapNodes($v, $e);
        }
      });
      // this is items that were added via push
      Utils.keyedChildren($vNode).forEach($v => {
        const $e = $realNode.querySelector(`[data-vbars-key="${$v.dataset.vbarsKey}"]`);
        if (!$e) {
          _addChild($realNode, $v);
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
            _compareKeys($vNode, $real);
          } else {
            _swapNodes($vNode, $real);
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

  var Helpers = {
    register({ instance, methods }) {
      function _handler() {
        const [eventType, ...args] = arguments;
        const opts = args.splice(-1, 1);

        if (args.some(arg => arg !== null && typeof arg === "object"))
          throw new Error(
            `must only pass primitives as argument to a handler. ${JSON.stringify(args, null, 2)}`
          );

        const handler = JSON.stringify({ methodName: opts[0].name, eventType, args });
        return _addData({ handler });
      }

      const _addData = pairs => {
        return new instance.SafeString(
          Object.keys(pairs)
            .map(key => `data-vbars-${key}='${pairs[key]}'`)
            .join(" ")
        );
      };

      instance.registerHelper("watch", (path, options) => {
        const id = `${options.loc.start.column}${options.loc.start.line}${options.loc.end.column}${options.loc.end.line}`;
        return _addData({ id, watch: path });
      });

      instance.registerHelper("keyed", val => _addData({ key: val }));
      instance.registerHelper("isChecked", val => (val ? "checked" : ""));
      instance.registerHelper("bind", path => _addData({ bind: path }));
      instance.registerHelper("ref", key => _addData({ ref: key }));

      Object.keys(methods).forEach(key => instance.registerHelper(key, _handler));
    },
  };

  var index = {
    create({ template, data: rawData, methods = {}, Handlebars = window.Handlebars }) {
      let $root, vDom;

      if (!Handlebars) throw new Error("Vbars need Handlebars in order to run!");

      const instance = Handlebars.create();
      const proxyData = buildProxy(rawData, ({ path }) => vDom.patch($root, path));
      Helpers.register({ instance, methods });
      const templateFn = instance.compile(template);

      return {
        VbarsComponent: true,
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
