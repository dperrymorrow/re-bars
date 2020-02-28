import Utils from "./utils.js";

export default function({ id, app, props = {}, methods, rawData = {}, watchers = {}, name }) {
  const cRef = app.storage.comp[id];

  function _handler(path) {
    Object.entries(watchers).forEach(([watch, fn]) => {
      if (Utils.shouldRender(path, watch)) fn({ data: proxyData, props, methods });
    });

    Object.entries(cRef.renders).forEach(([eId, handler]) => {
      if (Utils.shouldRender(path, handler.path)) {
        const $target = Utils.findComponent(eId);
        if ($target) {
          $target.innerHTML = handler.render();
          console.log("ReBars: re-render", $target, `${name}: ${path}`);
        } else {
          delete cRef.renders[eId];
        }
      }
    });

    Object.keys(app.storage.comp).forEach(cId => {
      if (!Utils.findComponent(cId)) {
        // will fire destory hook here...
        delete app.storage.comp[cId];
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

  const proxyData = _buildProxy({ ...rawData, ...props });
  return proxyData;
}
