import Utils from "./utils.js";

export default {
  register({ id, instance, app, methods, components, proxyData, parentData, props, watchers }) {
    const storage = app.storage.components[id];

    storage.handlers.bind = (event, path) =>
      Utils.setKey(proxyData, path, event.currentTarget.value);

    const handlerPath = `ReBars.apps.${app.id}.components.${id}.handlers`;

    function _handler() {
      const [eventType, ...args] = arguments;
      const opts = args.splice(-1, 1);
      const methodName = opts[0].name;

      const params = [methodName].concat(args).map(param => {
        if (param !== null && typeof parm === "object")
          throw new Error(
            `must only pass primitives as argument to a handler. ${JSON.stringify(args, null, 2)}`
          );
        if (typeof param === "string") return `'${param}'`;
        return param;
      });

      return new instance.SafeString(`on${eventType}="${handlerPath}.action(${params.join(",")})"`);
    }

    instance.registerHelper("debug", obj => {
      return new instance.SafeString(`<pre class="debug">${JSON.stringify(obj, null, 2)}</pre>`);
    });

    instance.registerHelper("watch", function(path, { fn }) {
      const eId = Utils.randomId();
      storage.renders[eId] = { render: fn.bind(null, proxyData), path };
      return Utils.wrapTemplate(eId, fn(proxyData));
    });

    instance.registerHelper("watchEach", function(arr, { fn }) {
      if (!Array.isArray(arr)) throw new Error("watchEach must be passed an Array");
      const path = arr.ReBarsPath;

      return arr.map((item, index) => {
        const eId = Utils.randomId();
        storage.renders[eId] = {
          render: fn.bind(null, item),
          path: `${path}.${index}.*`,
        };
        return Utils.wrapTemplate(eId, fn(item));
      });
    });

    Object.keys(components).forEach(name => {
      instance.registerHelper(name, function(options) {
        return new instance.SafeString(
          app.component({
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
      path => new instance.SafeString(`oninput="${handlerPath}.bind(event, '${path}')"`)
    );

    storage.handlers.bind = (event, path) =>
      Utils.setKey(proxyData, path, event.currentTarget.value);

    storage.handlers.action = function() {
      const [key, ...args] = arguments;

      return methods[key].call(
        null,
        {
          methods,
          watchers,
          data: proxyData,
          parentData,
          props,
          $refs: Utils.findRefs(id),
          event,
        },
        ...args
      );
    };

    Object.keys(methods).forEach(key => instance.registerHelper(key, _handler));
  },
};
