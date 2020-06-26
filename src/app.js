import Helpers from "./helpers.js";
import ReRender from "./re-render.js";
import ProxyTrap from "./proxy-trap.js";
import Utils from "./utils/index.js";
import Config from "./config.js";
import Garbage from "./garbage.js";

export default {
  app({
    helpers = {},
    template,
    data = {},
    methods = {},
    partials = {},
    watch = {},
    Handlebars = window.Handlebars,
    trace = false,
  }) {
    const instance = Handlebars.create();
    const templateFn = instance.compile(template);
    const store = { renders: {}, handlers: {} };

    Config.setTrace(trace);
    Utils.registerHelpers(instance, helpers);

    return {
      store,
      instance,
      render(selector) {
        const $app = document.querySelector(selector);

        if (!$app)
          return instance.log(3, `ReBars: document.querySelector("${selector}") could not be found on the document`);

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

        Garbage.start($app, store);
        $app.innerHTML = templateFn(scope.data);
      },
    };
  },
};
