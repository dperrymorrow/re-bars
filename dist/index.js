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

    randomId: () =>
      "_" +
      Math.random()
        .toString(36)
        .substr(2, 9),

    setKey(obj, path, value) {
      const arr = path.split(".");
      arr.reduce((pointer, key, index) => {
        if (!(key in pointer)) throw new Error(`${path} was not found in object`, obj);
        if (index + 1 === arr.length) pointer[key] = value;
        return pointer[key];
      }, obj);
    },
  };

  function VDom({ id, templateFn, proxyData }) {
    const $el = document.createElement("div");
    const render = () => ($el.innerHTML = templateFn(proxyData));

    function _swapNodes($source, $target) {
      const $clone = $source.cloneNode(true);
      $target.parentNode.replaceChild($clone, $target);
    }

    function _addChild($container, $child) {
      const $clone = $child.cloneNode(true);
      $container.appendChild($clone);
    }

    function _compareKeys($vNode, $realNode) {

      Utils.keyedChildren($realNode).forEach($e => {
        const $v = $vNode.querySelector(`[data-vbars-key="${$e.dataset.vbarsKey}"]`);
        if (!$v) {
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

    function patch(path) {
      const $target = document.getElementById(id);
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
    register({ id, instance, methods, components, proxyData }) {
      window.vbars = window.vbars || { handlers: {} };
      window.vbars.handlers[id] = {
        bind: (event, path) => Utils.setKey(proxyData, path, event.currentTarget.value),
      };
      // we can garbage collect here...

      function _handler() {
        const [eventType, ...args] = arguments;
        const opts = args.splice(-1, 1);

        if (args.some(arg => arg !== null && typeof arg === "object"))
          throw new Error(
            `must only pass primitives as argument to a handler. ${JSON.stringify(args, null, 2)}`
          );

        const handler = { methodName: opts[0].name, eventType, args };
        return new instance.SafeString(
          `on${eventType}="vbars.handlers.${id}.${handler.methodName}(${args.join(",")})"`
        );
      }

      const _findRefs = () => {
        return Array.from(document.getElementById(id)).reduce((obj, $el) => {
          obj[$el.dataset.vbarsRef] = $el;
          return obj;
        }, {});
      };

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

      Object.keys(components).forEach(name => {
        instance.registerHelper(name, function() {
          return new instance.SafeString(components[name].render());
        });
      });

      instance.registerHelper("keyed", val => _addData({ key: val }));
      instance.registerHelper("isChecked", val => (val ? "checked" : ""));
      instance.registerHelper("ref", key => _addData({ ref: key }));
      instance.registerHelper(
        "bind",
        path => new instance.SafeString(`oninput="vbars.handlers.${id}.bind(event, '${path}')"`)
      );

      // should throw an error if there is collision of method and comoponent name
      Object.keys(methods).forEach(key => {
        window.vbars.handlers[id][key] = function() {
          return methods[key].call(
            methods,
            { data: proxyData, $refs: _findRefs(), event },
            ...arguments
          );
        };
        instance.registerHelper(key, _handler);
      });
    },
  };

  var index = {
    create({
      template,
      data: rawData,
      components = {},
      methods = {},
      Handlebars = window.Handlebars,
    }) {
      if (!Handlebars) throw new Error("Vbars need Handlebars in order to run!");

      const id = Utils.randomId();
      const instance = Handlebars.create();
      const proxyData = buildProxy(rawData, ({ path }) => vDom.patch(path));

      Helpers.register({ id, instance, methods, components, proxyData });

      const templateFn = instance.compile(`<span id="${id}">${template}</span>`);
      const vDom = VDom({ id, templateFn, proxyData, methods });

      return {
        VbarsComponent: true,
        instance,
        id,
        data: proxyData,
        render() {
          return templateFn(proxyData);
        },
      };
    },
  };

  return index;

})));
