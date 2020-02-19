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
    findComponent: id => document.getElementById(id),
    wrapTemplate: (id, html) => `<span id="${id}">${html}</span>`,

    findRefs(id) {
      return Array.from(this.findComponent(id).querySelectorAll("[data-vbars-ref]")).reduce(
        (obj, $el) => {
          obj[$el.dataset.vbarsRef] = $el;
          return obj;
        },
        {}
      );
    },

    name: "Vbars",

    shouldRender(path, watchPath) {
      if (path === watchPath) return true;
      return this.getWildCard(path) === watchPath;
    },

    getWildCard(path) {
      const segs = path.split(".").slice(0, -1);
      segs.push("*");
      return segs.join(".");
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

  var Helpers = {
    register({ id, instance, methods, components, proxyData, parentData, props }) {
      const globalRef = {
        handlers: {
          bind: (event, path) => Utils.setKey(proxyData, path, event.currentTarget.value),
        },
        renders: {},
      };

      window[Utils.name] = window[Utils.name] || { components: {} };
      window[Utils.name].components[id] = globalRef;

      function _handler() {
        const [eventType, ...args] = arguments;
        const opts = args.splice(-1, 1);

        if (args.some(arg => arg !== null && typeof arg === "object"))
          throw new Error(
            `must only pass primitives as argument to a handler. ${JSON.stringify(args, null, 2)}`
          );

        const handler = { methodName: opts[0].name, eventType, args };

        return new instance.SafeString(
          `on${eventType}="${Utils.name}.components.${id}.handlers.${handler.methodName}(${args.join(
          ","
        )})"`
        );
      }

      instance.registerHelper("debug", obj => {
        return new instance.SafeString(`<pre class="debug">${JSON.stringify(obj, null, 2)}</pre>`);
      });

      instance.registerHelper("watch", function(path, { fn }) {
        const eId = Utils.randomId();
        globalRef.renders[eId] = { render: fn.bind(null, proxyData), path };
        return Utils.wrapTemplate(eId, fn(proxyData));
      });

      instance.registerHelper("watchEach", function(arr, arrName, { fn }) {
        return arr.map((item, index) => {
          const eId = Utils.randomId();
          globalRef.renders[eId] = {
            render: fn.bind(null, item),
            path: `${arrName}.${index}.*`,
          };
          return Utils.wrapTemplate(eId, fn(item));
        });
      });

      Object.keys(components).forEach(name => {
        instance.registerHelper(name, function(options) {
          return new instance.SafeString(
            Vbars.component({
              ...components[name],
              ...{ parentData: proxyData, props: options.hash },
            })
          );
        });
      });

      instance.registerHelper("isChecked", val => (val ? "checked" : ""));
      instance.registerHelper("ref", key => new instance.SafeString(`data-vbars-ref="${key}"`));
      instance.registerHelper(
        "bind",
        path =>
          new instance.SafeString(
            `oninput="${Utils.name}.components.${id}.handlers.bind(event, '${path}')"`
          )
      );

      // should throw an error if there is collision of method and comoponent name
      Object.keys(methods).forEach(key => {
        globalRef.handlers[key] = function() {
          return methods[key].call(
            methods,
            { data: proxyData, parentData, props, $refs: Utils.findRefs(id), event },
            ...arguments
          );
        };
        instance.registerHelper(key, _handler);
      });
    },
  };

  var Vbars = {
    component({
      template,
      data = {},
      components = {},
      methods = {},
      parentData = {},
      props = {},
      hooks = {},
      Handlebars = window.Handlebars,
    }) {
      if (!Handlebars) throw new Error("Vbars need Handlebars in order to run!");

      const id = Utils.randomId();
      const instance = Handlebars.create();

      // need to call created before building the proxy
      if (hooks.created) hooks.created(...arguments);

      const proxyData = buildProxy(data, ({ path }) => {
        const globalRef = window[Utils.name].components[id];

        Object.keys(globalRef.renders).forEach(eId => {
          const handler = globalRef.renders[eId];

          if (Utils.shouldRender(path, handler.path)) {
            const $target = Utils.findComponent(eId);
            if ($target) {
              $target.innerHTML = handler.render();
            } else {
              delete globalRef[eId];
            }
          }
        });

        setTimeout(() => {
          Object.keys(window[Utils.name].components).forEach(cId => {
            if (!Utils.findComponent(cId)) {
              delete window[Utils.name].components[cId];
            }
          });
        }, 100);
      });

      const templateFn = instance.compile(template);

      Helpers.register({ id, instance, methods, components, proxyData, parentData, props });

      if ("attached" in hooks) {
        const int = setInterval(() => {
          if (Utils.findComponent(id)) {
            clearInterval(int);
            hooks.attached({
              ...{ methods, data: proxyData, parentData, props },
              ...{ $refs: Utils.findRefs(id) },
            });
          }
        }, 100);
      }

      return Utils.wrapTemplate(id, templateFn(data));
    },
  };

  return Vbars;

})));
