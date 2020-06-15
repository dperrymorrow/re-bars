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
      const { hash, loc } = args.pop();
      const id = Utils.randomId();
      const tplScope = this;

      Object.entries(hash).forEach(([eventType, methodName]) => {
        // check for method existance

        Utils.nextTick().then(function() {
          const $el = Utils.dom.findMethod(id);
          if (!$el) return;

          if (!(methodName in scope.methods)) instance.log(3, `ReBars: "${methodName}" is not a method.`, hash, $el);

          $el.addEventListener(eventType, event => {
            const context = {
              event,
              $app: scope.$app,
              $refs: Utils.dom.findRefs.bind(null, scope.$app),
              $nextTick: Utils.nextTick,
              rootData: scope.data,
            };

            context.methods = Utils.bind(scope.methods, tplScope, context);
            context.methods[methodName](...args);
          });
        });
      });

      return new instance.SafeString(`${attrs.method}="${id}"`);
    });

    instance.registerHelper("watch", function(...args) {
      const { fn, hash } = args.pop();
      const eId = Utils.randomId();

      store.renders[eId] = {
        path: args.filter(arg => typeof arg === "string"),
        render: () => fn(this),
      };

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

      Utils.nextTick().then(() => {
        const $el = Utils.dom.findWatcher(eId);
        if (!$el) return;

        store.renders[eId].$el = $el;

        args.forEach(path => {
          if (typeof path !== "string") instance.log(3, "ReBars: can only watch Strings", args, $el);
        });
        instance.log(Config.logLevel(), "ReBars: watching", store.renders[eId].path, $el);
      });

      return Utils.dom.wrapWatcher(eId, fn(this), hash);
    });
  },
};
