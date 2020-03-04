import Utils from "../utils.js";

export default {
  register(appId, { instance, name }) {
    const _makeParams = args => {
      return args.map(param => {
        if (["[event]"].includes(param)) return param.replace("[", "").replace("]", "");
        if (param !== null && typeof parm === "object")
          throw new Error(
            `component:${name} must only pass primitives as argument to a handler. ${JSON.stringify(args, null, 2)}`
          );
        if (typeof param === "string") return `'${param}'`;
        return param;
      });
    };

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
