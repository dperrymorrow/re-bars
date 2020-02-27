import Utils from "./utils.js";

export default function({ id, app, props, data, watchers, name }) {
  const cRef = app.storage.comp[id];

  function _handler(path) {
    Object.keys(watchers).forEach(watchPath => {
      if (Utils.shouldRender(path, watchPath)) {
        console.log(`ReBars: watcher "${name}.${path}"`);
        watchers[watchPath].call(null, { data: proxyData, props });
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

  const proxyData = _buildProxy({ ...data, ...props });
  return proxyData;
}
