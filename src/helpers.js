import Utils from "./utils.js";
import Vbars from "./index.js";

export default {
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
