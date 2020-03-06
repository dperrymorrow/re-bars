import ReRender from "./re-render.js";

export default {
  create({ appId, compId, $props, data, methods, name }) {
    let watching = false;
    const { patch } = ReRender.init(...arguments);

    function _buildProxy(raw, tree = []) {
      return new Proxy(raw, {
        get: function(target, prop) {
          if (prop === "ReBarsPath") return tree.join(".");
          const value = Reflect.get(...arguments);
          // not sure we need this anymore should only proxy the data...
          if (typeof value === "function" && target.hasOwnProperty(prop)) return value.bind(proxyData);
          if (value !== null && typeof value === "object" && prop !== "methods")
            return _buildProxy(value, tree.concat(prop));
          else return value;
        },

        set: function(target, prop) {
          const ret = Reflect.set(...arguments);
          const path = tree.concat(prop).join(".");
          if (!watching)
            throw new Error(
              `component:${name} set '${path}' before being added to the DOM. Usually caused by side effects from a hook or a data function, `
            );
          patch(path);
          return ret;
        },

        deleteProperty: function(target, prop) {
          const ret = Reflect.deleteProperty(...arguments);
          const path = tree.concat(prop).join(".");
          if (!watching)
            throw new Error(
              `component:${name} deleted '${path}' before being added to the DOM. Usually caused by side effects from a hook or a data function`
            );

          patch(path);
          return ret;
        },
      });
    }

    const proxyData = _buildProxy({
      ...data,
      ...$props,
      ...{ methods },
      $_componentId: compId,
      $_appId: appId,
    });
    return {
      watch: () => (watching = true),
      data: proxyData,
    };
  },
};
