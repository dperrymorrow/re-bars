import Utils from "./utils/index.js";

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

const _makeParams = args => {
  return args.map(param => {
    if (["[event]"].includes(param)) return param.replace("[", "").replace("]", "");
    if (param !== null && typeof param === "object")
      throw new Error(
        `component:${name} must only pass primitives as argument to a handler. \n${JSON.stringify(param, null, 2)}`
      );
    if (typeof param === "string") return `'${param}'`;
    if (param === null) return `${param}`;
    return param;
  });
};

export default {
  register(appId, { instance, helpers, name }) {
    // component
    instance.registerHelper("component", function(cName, { hash: props }) {
      const cDefs = Utils.getStorage(appId).cDefs;
      if (!cDefs[cName]) throw new Error(`component:${name} child component ${cName} is not registered`);
      return new instance.SafeString(cDefs[cName].instance(props).render());
    });

    // add component helpers
    Object.entries(helpers).forEach(([name, fn]) => instance.registerHelper(name, fn));
    // add ref helper
    instance.registerHelper("ref", key => new instance.SafeString(`data-rbs-ref="${key}"`));
    // watch helpers and debug
    instance.registerHelper("debug", function(obj, { data }) {
      const render = () =>
        `<pre class="debug">${JSON.stringify(
          obj,
          (key, val) => (typeof val === "function" ? val + "" : val),
          2
        )}</pre>`;
      const eId = _watch(_getPath(obj), render, data);
      return new instance.SafeString(Utils.dom.wrapWatcher(eId, render()));
    });

    instance.registerHelper("watch", function(...args) {
      const { fn, hash, data } = args.pop();
      const path = args
        .map(arg => _getPath(arg, false))
        .join(".")
        .split(",");

      const eId = _watch(path, () => fn(this), data);
      return Utils.dom.wrapWatcher(eId, fn(this), hash);
    });

    // events, (just curries to the rbs.handlers)
    instance.registerHelper("method", function() {
      const [str, ...args] = arguments;
      const [methodName, eventType = "click"] = str.split(":");
      const { data } = args.pop();
      const { $_appId, $_componentId } = data.root;
      const params = _makeParams([$_appId, $_componentId, methodName, "[event]"].concat(args));
      return new instance.SafeString(`on${eventType}="rbs.handlers.trigger(${params.join(",")})"`);
    });

    instance.registerHelper("bound", (path, { hash = {}, data }) => {
      const { $_appId, $_componentId } = data.root;
      const val = Utils.findByPath(data.root, path);
      const ref = hash.ref || path;
      const params = _makeParams([$_appId, $_componentId, "[event]", path]);

      return new instance.SafeString(
        `value="${val}" data-rbs-ref="${ref}" oninput="rbs.handlers.bound(${params.join(",")})"`
      );
    });
  },
};
