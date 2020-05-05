import Utils from "./utils/index.js";
import Constants from "./constants.js";
import Msg from "./msg.js";

export default {
  create(data, callback) {
    let que = [];

    const _debounced = Utils.debounce(() => {
      callback(que);
      que = [];
    });

    const _addToQue = path => {
      que.push(path);
      _debounced(que);
    };

    function _buildProxy(raw, tree = []) {
      return new Proxy(raw, {
        get: function(target, prop) {
          if (prop === "ReBarsPath") return tree.join(".");
          const value = Reflect.get(...arguments);
          if (typeof value === "function" && target.hasOwnProperty(prop)) return value.bind(proxyData);
          // we dont watch any of the protected items
          if (Constants.protectedKeys.includes(tree[0])) return value;
          if (value !== null && typeof value === "object" && prop !== "methods")
            return _buildProxy(value, tree.concat(prop));
          else return value;
        },

        set: function(target, prop) {
          const ret = Reflect.set(...arguments);
          const path = tree.concat(prop).join(".");
          // we dont trigger on protected keys
          if (Constants.protectedKeys.includes(tree[0]))
            Msg.warn(`attempted to set a protected key "${path}". readOnly properties are ${Constants.protectedKeys}`);
          else _addToQue(path);
          return ret;
        },

        deleteProperty: function(target, prop) {
          const ret = Reflect.deleteProperty(...arguments);
          const path = tree.concat(prop).join(".");
          if (!Constants.protectedKeys.includes(tree[0]))
            Msg.fail(`cannot delete protected key ${path}. readOnly properties are ${Constants.protectedKeys}`);
          _addToQue(path);
          return ret;
        },
      });
    }

    const proxyData = _buildProxy(data);
    return proxyData;
  },
};
