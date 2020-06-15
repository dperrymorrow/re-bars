// import Msg from "./msg.js";
import Helpers from "./helpers.js";
import ReRender from "./re-render.js";
import ProxyTrap from "./proxy-trap.js";
import Utils from "./utils/index.js";
import Config from "./config.js";

export default {
  app({
    helpers = {},
    template,
    data = {},
    refs = {},
    methods = {},
    partials = {},
    watch = {},
    Handlebars = window.Handlebars,
    trace = false,
  }) {
    const instance = Handlebars.create();
    const templateFn = instance.compile(template);
    const store = { renders: {} };

    Config.setTrace(trace);
    Utils.registerHelpers(instance, helpers);

    return {
      store,
      instance,
      render(selector) {
        const $app = document.querySelector(selector);
        const scope = {
          $app,
          methods,
          data,
        };

        Helpers.register({ instance, template, store, scope });
        Utils.registerPartials(instance, scope, partials);

        // for the methods
        scope.data = Object.entries(scope.data).reduce((scoped, [key, value]) => {
          if (typeof value === "function" && scoped.hasOwnProperty(key)) scoped[key] = value.bind(scope);
          return scoped;
        }, data);

        scope.data = ProxyTrap.create(data, changed => {
          instance.log(Config.logLevel(), "ReBars: change", changed);
          ReRender.paths({ changed, store, instance });
          Object.entries(watch).forEach(([path, fn]) => {
            if (Utils.shouldRender(changed, [path])) fn.call(scope);
          });
        });

        $app.innerHTML = templateFn(scope.data);
      },
    };
  },
};
