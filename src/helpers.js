// import Msg from "./msg.js";
import Utils from "./utils/index.js";
import ProxyTrap from "./proxy-trap.js";
import Config from "./config.js";

const { attrs } = Config;

export default {
  register({ instance, template, store, scope }) {
    instance.registerHelper("ref", name => new instance.SafeString(`${attrs.ref}="${name}"`));
    instance.registerHelper("buildPath", function(...args) {
      args.pop();
      return Array.from(args).join(".");
    });

    instance.registerHelper("on", function(...args) {
      const { loc } = args.pop();
      const id = Utils.randomId();
      const [eventType, methodName, ...rest] = args;
      const tplScope = this;
      // check for method existance
      if (!(args[1] in scope.methods)) instance.log(3, `ReBars: "${args[1]}" is not a method. line: ${loc.start.line}`);

      Utils.debounce(() => {
        const $el = Utils.dom.findMethod(id);
        if (!$el) return;

        $el.addEventListener(eventType, event => {
          const context = {
            event,
            $app: scope.$app,
            $refs: Utils.dom.findRefs.bind(null, scope.$app),
            rootData: scope.data,
          };

          context.methods = Utils.bind(scope.methods, tplScope, context);
          context.methods[methodName](...rest);
        });
      })();

      return new instance.SafeString(`${attrs.method}="${id}"`);
    });

    instance.registerHelper("watch", function(...args) {
      const last = args.pop();
      const { fn, hash, data, loc } = last;

      const eId = Utils.randomId();

      const _getPath = target => {
        if (target === undefined) instance.log(3, "undefined cannot be watched", { template, loc });
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
