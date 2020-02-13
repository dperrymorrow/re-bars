import Utils from "./utils.js";

export default {
  register({ id, instance, methods, components, proxyData, parentData }) {
    console.log(parentData);
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
      return Array.from(Utils.findComponent(id).querySelectorAll("[data-vbars-ref]")).reduce(
        (obj, $el) => {
          obj[$el.dataset.vbarsRef] = $el;
          return obj;
        },
        {}
      );
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
        return new instance.SafeString(components[name].render(proxyData));
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
        const props = Utils.findComponent(id).dataset;
        return methods[key].call(
          methods,
          { data: proxyData, parent: parentData, props, $refs: _findRefs(), event },
          ...arguments
        );
      };
      instance.registerHelper(key, _handler);
    });
  },
};
