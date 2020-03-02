import Utils from "../utils.js";

export default function(storage, { instance, name }) {
  const _getPath = (target, wildcard = true) => {
    if (target === undefined)
      throw new Error(`have passed undefined to watch helper in component '${name}'`);
    return typeof target === "object" ? `${target.ReBarsPath}${wildcard ? ".*" : ""}` : target;
  };

  const _watch = (path, render) => {
    const eId = Utils.randomId();
    storage.renders[eId] = { path, render };
    return eId;
  };

  instance.registerHelper("debug", function(obj) {
    const render = () => `<pre class="debug">${JSON.stringify(obj, null, 2)}</pre>`;
    const eId = _watch(_getPath(obj), render);
    return new instance.SafeString(Utils.wrapWatch(eId, render()));
  });

  instance.registerHelper("watch", function(...args) {
    const { fn, hash } = args.pop();

    const path = args
      .map(arg => _getPath(arg, false))
      .join(".")
      .split(",");

    const eId = _watch(path, () => fn(this));
    return Utils.wrapWatcher(eId, fn(this), hash);
  });
}
