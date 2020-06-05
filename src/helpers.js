import Msg from "./msg.js";
import Utils from "./utils/index.js";
import ProxyTrap from "./proxy-trap.js";
import Constants from "./constants.js";

const { attrs } = Constants;

export default {
  register({ instance, template, store, methods }) {
    instance.registerHelper("ref", name => new instance.SafeString(`${attrs.ref}="${name}"`));

    instance.registerHelper("on", function(...args) {
      const { loc } = args.pop();
      if (!(args[1] in methods)) Msg.fail(`"${args[1]}" is not a method`, { template, loc });
      return new instance.SafeString(`${attrs.method}='${Utils.stringify(args, 0)}'`);
    });

    instance.registerHelper("watch", function(...args) {
      const last = args.pop();
      const { fn, hash, data, loc } = last;

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

      // path.forEach(item => {
      //   if (!Utils.hasKey(data.root, item)) {
      //     debugger;
      //     Msg.fail(`cannot find path "${item}" to watch`, { template, loc });
      //   }
      // });

      store.renders[eId] = {
        path,
        render: () => fn(this),
      };

      return Utils.dom.wrapWatcher(eId, fn(this), hash);
    });
  },
};
