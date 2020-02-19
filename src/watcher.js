import Utils from "./utils.js";

export default function({ id, storage, rawData }) {
  function _handler(path) {
    const cRef = storage.components[id];

    console.log("Rebars update:", path);

    Object.keys(cRef.renders).forEach(eId => {
      const handler = cRef.renders[eId];

      if (Utils.shouldRender(path, handler.path)) {
        const $target = Utils.findComponent(eId);
        if ($target) {
          $target.innerHTML = handler.render();
          console.log($target);
        } else {
          delete storage.components[eId];
        }
      }
    });

    Object.keys(storage.components).forEach(cId => {
      if (!Utils.findComponent(cId)) {
        console.log("ReBars:", `removing handlers, and renders for ${cId}`);
        delete storage.components[cId];
      }
    });
  }

  function _buildProxy(raw, tree = []) {
    return new Proxy(raw, {
      get: function(target, prop) {
        if (prop === "ReBarsPath") return tree.join(".");
        const value = Reflect.get(...arguments);
        if (value !== null && typeof value === "object" && prop !== "methods")
          return _buildProxy(value, tree.concat(prop));
        else return value;
      },

      set: function(target, prop) {
        const ret = Reflect.set(...arguments);
        _handler(tree.concat(prop).join("."));
        return ret;
      },

      deleteProperty: function(target, prop) {
        const ret = Reflect.deleteProperty(...arguments);
        _handler(tree.concat(prop).join("."));
        return ret;
      },
    });
  }

  return _buildProxy(rawData);
}
