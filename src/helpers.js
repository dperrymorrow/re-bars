import Utils from "./utils.js";
import Vbars from "./index.js";

export default {
  register({ id, instance, methods, components, proxyData, parentData, props }) {
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

    const _addData = pairs => {
      return new instance.SafeString(
        Object.keys(pairs)
          .map(key => `data-vbars-${key}='${pairs[key]}'`)
          .join(" ")
      );
    };

    instance.registerHelper("debug", obj => {
      return new instance.SafeString(`<pre class="debug">${JSON.stringify(obj, null, 2)}</pre>`);
    });

    instance.registerHelper("watch", function(path, { fn }) {
      const id = Utils.randomId();
      setTimeout(() => {
        document.getElementById(id).vBarsRender = fn;
      }, 0);
      return `<span id="${id}" ${_addData({ watch: path })}>${fn(proxyData)}</span>`;
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
          { data: proxyData, parentData, props, $refs: Utils.findRefs(id), event },
          ...arguments
        );
      };
      instance.registerHelper(key, _handler);
    });
  },
};
