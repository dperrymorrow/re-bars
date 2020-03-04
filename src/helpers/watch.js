import Utils from "../utils.js";

export default {
  register(appId, { instance, name }) {
    const _getPath = (target, wildcard = true) => {
      if (target === undefined) throw new Error(`have passed undefined to watch helper in component '${name}'`);
      return typeof target === "object" ? `${target.ReBarsPath}${wildcard ? ".*" : ""}` : target;
    };

    const _watch = (path, render, { root }) => {
      const eId = Utils.randomId();
      const store = Utils.getStorage(root.$_appId, root.$_componentId);

      store.renders[eId] = {
        path,
        render,
      };
      return eId;
    };

    instance.registerHelper("debug", function(obj, { data }) {
      const render = () => `<pre class="debug">${JSON.stringify(obj, null, 2)}</pre>`;
      const eId = _watch(_getPath(obj), render, data);
      return new instance.SafeString(Utils.wrapWatch(eId, render()));
    });

    instance.registerHelper("watch", function(...args) {
      const { fn, hash, data } = args.pop();

      const path = args
        .map(arg => _getPath(arg, false))
        .join(".")
        .split(",");

      const eId = _watch(path, () => fn(this), data);
      return Utils.wrapWatcher(eId, fn(this), hash);
    });
  },
};
