import Utils from "../utils/index.js";

export default {
  register(instance) {
    // events, (just curries to the rbs.handlers)
    instance.registerHelper("method", function() {
      const [str, ...args] = arguments;
      const [methodName, eventType = "click"] = str.split(":");
      const { data } = args.pop();
      const { $_appId, $_componentId } = data.root;
      const params = Utils.makeParams([$_appId, $_componentId, methodName, "[event]"].concat(args));
      return new instance.SafeString(`on${eventType}="rbs.handlers.trigger(${params.join(",")})"`);
    });

    instance.registerHelper("bound", (path, { hash = {}, data }) => {
      const { $_appId, $_componentId } = data.root;
      const val = Utils.findByPath(data.root, path);
      const ref = hash.ref || path;
      const params = Utils.makeParams([$_appId, $_componentId, "[event]", path]);

      return new instance.SafeString(
        `value="${val}" data-rbs-ref="${ref}" oninput="rbs.handlers.bound(${params.join(",")})"`
      );
    });
  },
};
