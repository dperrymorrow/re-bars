import Utils from "./utils/index.js";

export default {
  create(data, callback, trackGet = false) {
    let que = [];

    const _debounced = Utils.debounce(() => {
      callback(que);
      que = [];
    });

    const _addToQue = path => {
      if (!que.includes(path)) que.push(path);
      _debounced(que);
    };

    function _buildProxy(raw, tree = []) {
      return new Proxy(raw, {
        get: function(target, prop) {
          const value = Reflect.get(...arguments);

          if (typeof value === "function" && target.hasOwnProperty(prop)) {
            return value.bind(proxyData);
          }

          if (value && typeof value === "object" && ["Array", "Object"].includes(value.constructor.name)) {
            return _buildProxy(value, tree.concat(prop));
          } else {
            if (trackGet) _addToQue(tree.concat(prop).join("."));
            return value;
          }
        },

        set: function(target, prop, value) {
          const ret = Reflect.set(...arguments);
          const path = tree.concat(prop).join(".");
          _addToQue(path);
          return ret;
        },

        deleteProperty: function(target, prop) {
          const ret = Reflect.deleteProperty(...arguments);
          const path = tree.concat(prop).join(".");
          _addToQue(path);
          return ret;
        },
      });
    }

    const proxyData = _buildProxy(data);
    return proxyData;
  },
};
