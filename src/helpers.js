// import Msg from "./msg.js";
import Utils from "./utils/index.js";
import ProxyTrap from "./proxy-trap.js";
import Config from "./config.js";

const { attrs } = Config;

export default {
  register({ instance, template, store, scope }) {
    instance.registerHelper("ref", name => new instance.SafeString(`${attrs.ref}="${name}"`));

    instance.registerHelper("on", function(...args) {
      const { hash } = args.pop();
      const id = Utils.randomId();
      const tplScope = this;

      store.handlers[id] = [];

      Object.entries(hash).forEach(([eventType, methodName]) => {
        // check for method existance

        Utils.nextTick().then(function() {
          const $el = Utils.dom.findMethod(id);
          if (!$el) return;

          if (!(methodName in scope.methods)) instance.log(3, `ReBars: "${methodName}" is not a method.`, hash, $el);

          const handler = event => {
            const context = Utils.buildContext(tplScope, scope);
            context.event = event;
            context.methods[methodName](...args);
          };

          store.handlers[id].push({ $el, handler, eventType });
          $el.addEventListener(eventType, handler);
        });
      });

      return new instance.SafeString(`${attrs.method}="${id}"`);
    });

    instance.registerHelper("concat", function(...args) {
      args.pop();
      return args.join("");
    });

    instance.registerHelper("watch", function(...args) {
      const { fn, hash } = args.pop();
      const eId = Utils.randomId();

      const ref = {
        path: args.filter(arg => typeof arg === "string"),
        render: () => fn(this),
      };

      if (!args.length) {
        const trap = ProxyTrap.create(
          { ...scope, data: this },
          paths => {
            ref.path = paths;
          },
          true
        );

        fn(trap);
      }

      Utils.nextTick().then(() => {
        const $el = Utils.dom.findWatcher(eId);
        if (!$el) return;

        store.renders[eId] = { ...ref, $el };

        args.forEach(path => {
          if (typeof path !== "string")
            instance.log(3, `ReBars: can only watch Strings, ${typeof path} - ${path} given`, args, $el);
        });
      });

      return Utils.dom.wrapWatcher(eId, fn(this), hash);
    });
  },
};
