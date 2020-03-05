import ReRender from "./re-render.js";

export default {
  create({ appId, compId, props, data, methods }) {
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
          patch(tree.concat(prop).join("."));
          return ret;
        },

        deleteProperty: function(target, prop) {
          const ret = Reflect.deleteProperty(...arguments);
          patch(tree.concat(prop).join("."));
          return ret;
        },
      });
    }

    const proxyData = _buildProxy({ ...props, ...data(), ...{ methods }, $_componentId: compId, $_appId: appId });
    return proxyData;
  },
};
