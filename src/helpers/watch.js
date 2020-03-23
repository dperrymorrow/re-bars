import Utils from "../utils/index.js";
import Msg from "../msg.js";

export default {
  register(instance, template) {
    instance.registerHelper("watch", function(...args) {
      const { fn, hash, data, loc } = args.pop();

      const _getPath = (target, wildcard = true) => {
        if (target === undefined) Msg.fail("paramUndef", { template, loc, data });
        return typeof target === "object" ? `${target.ReBarsPath}${wildcard ? ".*" : ""}` : target;
      };

      const path = args
        .map(arg => _getPath(arg, false))
        .join(".")
        .split(",");

      const eId = Utils.randomId();
      const store = Utils.getStorage(data.root.$_appId, data.root.$_componentId);

      store.renders[eId] = {
        path,
        render: () => fn(this),
      };

      return Utils.dom.wrapWatcher(eId, fn(this), hash);
    });
  },
};
