import Msg from "./msg.js";
import Utils from "./utils/index.js";
import ProxyTrap from "./proxy-trap.js";

export default {
  register({ instance, helpers, template, store }) {
    Object.entries(helpers).forEach(([name, fn]) => instance.registerHelper(name, fn));

    instance.registerHelper("debug", (obj, { hash, data, loc }) => {
      if (obj === undefined) Msg.fail("undefined passed to debug", { template, loc });
      const props = { class: "debug", ...hash };
      return new instance.SafeString(`<pre ${Utils.dom.propStr(props)}>${Utils.stringify(obj)}</pre>`);
    });

    instance.registerHelper("watch", function(...args) {
      const { fn, hash, data, loc } = args.pop();

      const eId = Utils.randomId();

      const _getPath = target => {
        if (target === undefined) Msg.fail("undefined cannot be watched", { template, loc });
        return typeof target === "object" ? `${target.ReBarsPath}.*` : target;
      };

      const path = args.map(_getPath);

      if (!path.length) {
        const trap = ProxyTrap.create(
          data.root,
          paths => {
            store.renders[eId].path = paths;
          },
          true
        );

        fn(trap);
      }

      path.forEach(item => {
        if (!Utils.hasKey(data.root, item)) Msg.fail(`cannot find path "${item}" to watch`, { template, loc });
      });

      store.renders[eId] = {
        path,
        render: () => fn(this),
      };

      return Utils.dom.wrapWatcher(eId, fn(this), hash);
    });
  },
};
