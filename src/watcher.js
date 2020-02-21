import Utils from "./utils.js";

export default function({ id, app, parentData, props, data, watchers, name }) {
  function _handler(path) {
    const cRef = app.storage.components[id];

    Object.keys(watchers).forEach(watchPath => {
      if (Utils.shouldRender(path, watchPath)) {
        console.log(`ReBars: watcher "${name}.${path}"`);
        watchers[watchPath].call(null, { data: proxyData, parentData, props });
      }
    });

    Object.keys(cRef.renders).forEach(eId => {
      const handler = cRef.renders[eId];

      if (Utils.shouldRender(path, handler.path)) {
        const $target = Utils.findComponent(eId);
        if ($target) {
          $target.innerHTML = handler.render();
          console.log("ReBars: re-render", $target, `component: ${name}`, `path: ${path}`);
        } else {
          delete app.storage.components[eId];
        }
      }
    });

    Object.keys(app.storage.components).forEach(cId => {
      if (!Utils.findComponent(cId)) delete app.storage.components[cId];
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

  const proxyData = _buildProxy(data);
  return proxyData;
}
