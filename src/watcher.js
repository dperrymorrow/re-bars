import Utils from "./utils.js";

export default function({ id, app, props = {}, methods, rawData = {}, watchers = {}, name }) {
  const cRef = app.storage.comp[id];

  // the handling of change

  function _handler(path) {
    Object.entries(watchers).forEach(([watch, fn]) => {
      if (Utils.shouldRender(path, watch)) fn({ data: proxyData, props, methods });
    });

    Object.entries(cRef.renders).forEach(([eId, handler]) => {
      if (Utils.shouldRender(path, handler.path)) {
        const $target = Utils.findWatcher(eId);
        if ($target) {
          const html = handler.render();
          const $active = document.activeElement;
          const activeRef = {
            ref: $active.dataset.rbsRef,
            pos: $active.selectionStart,
          };

          if ($target.innerHTML !== html) {
            $target.innerHTML = html;
            console.log("ReBars: re-render", $target, `${name}: ${path}`);

            const $input = Utils.findRefs($target)[activeRef.ref];

            if ($input) {
              if (Array.isArray($input)) {
                console.warn(
                  `component:${name} ref ${activeRef.ref} is used more than once. The focus cannot be restored. If using bind, add a ref="uniqeName" to each`
                );
              } else {
                $input.focus();
                if (activeRef.pos) $input.setSelectionRange(activeRef.pos + 1, activeRef.pos + 1);
              }
            }
          }
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

  // the proxy building

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
