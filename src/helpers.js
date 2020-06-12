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

      Utils.nextTick().then(function() {
        const $el = Utils.dom.findMethod(id);
        if (!$el) return;

        $el.addEventListener(eventType, event => {
          const context = {
            event,
            $app: scope.$app,
            $refs: Utils.dom.findRefs.bind(null, scope.$app),
            $nextTick: Utils.nextTick,
            rootData: scope.data,
          };

          context.methods = Utils.bind(scope.methods, tplScope, context);
          context.methods[methodName](...rest);
        });
      });

      return new instance.SafeString(`${attrs.method}="${id}"`);
    });

    instance.registerHelper("watch", function(...args) {
      const { fn, hash } = args.pop();
      const eId = Utils.randomId();

      if (!args.length) {
        const trap = ProxyTrap.create(
          this,
          paths => {
            store.renders[eId].path = paths;
          },
          true
        );

        fn(trap);
      }

      store.renders[eId] = {
        path: args.filter(arg => typeof arg === "string"),
        render: () => fn(this),
      };

      Utils.nextTick().then(() => {
        const $el = Utils.dom.findWatcher(eId);
        if (!$el) return;

        args.forEach(path => {
          if (typeof path !== "string") instance.log(3, "ReBars: can only watch Strings", args, $el);
        });
        instance.log(Config.logLevel(), "ReBars: watching", store.renders[eId].path, $el);
      });

      return Utils.dom.wrapWatcher(eId, fn(this), hash);
    });
  },
};
