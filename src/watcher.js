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

export default buildProxy;
