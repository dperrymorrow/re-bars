import Utils from "../utils/index.js";

const _watch = (path, render, { root }) => {
  const eId = Utils.randomId();
  const store = Utils.getStorage(root.$_appId, root.$_componentId);

  store.renders[eId] = {
    path,
    render,
  };
  return eId;
};

export default {
  register(instance) {
    const _getPath = (name, target, wildcard = true) => {
      if (target === undefined) throw new Error(`have passed undefined to watch helper in component '${name}'`);
      return typeof target === "object" ? `${target.ReBarsPath}${wildcard ? ".*" : ""}` : target;
    };

    // watch helpers and debug
    instance.registerHelper("debug", function(obj, { data }) {
      const render = () =>
        `<pre class="debug">${JSON.stringify(
          obj,
          (key, val) => (typeof val === "function" ? val + "" : val),
          2
        )}</pre>`;
      const eId = _watch(_getPath(data.root.$name, obj), render, data);
      return new instance.SafeString(Utils.dom.wrapWatcher(eId, render()));
    });

    instance.registerHelper("watch", function(...args) {
      const { fn, hash, data } = args.pop();
      const path = args
        .map(arg => _getPath(data.root.$name, arg, false))
        .join(".")
        .split(",");

      const eId = _watch(path, () => fn(this), data);
      return Utils.dom.wrapWatcher(eId, fn(this), hash);
    });
  },
};
