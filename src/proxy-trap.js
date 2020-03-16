import ReRender from "./re-render.js";
import Msg from "./msg.js";

export default {
  create(data) {
    let que;

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

          if (!que) Msg.fail("preRenderChange", { name: proxyData.$name, path });

          que(path);
          return ret;
        },

        deleteProperty: function(target, prop) {
          const ret = Reflect.deleteProperty(...arguments);
          const path = tree.concat(prop).join(".");

          if (!que) Msg.fail("preRenderChange", { name: proxyData.$name, path });

          que(path);
          return ret;
        },
      });
    }

    const proxyData = _buildProxy(data);
    return {
      watch() {
        que = ReRender.init(proxyData.$_appId, proxyData.$_componentId).que;
      },
      data: proxyData,
    };
  },
};
