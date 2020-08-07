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
    hooks = {},
    Handlebars = window.Handlebars,
    trace = false,
  }) {
    const instance = Handlebars.create();
    const templateFn = instance.compile(template);
    const store = { renders: {}, handlers: {} };

    if (!Handlebars) return instance.log(3, "ReBars: needs Handlebars in order to run");

    Config.setTrace(trace);

    return {
      store,
      instance,
      async render(selector) {
        const $app = document.querySelector(selector);

        if (!$app)
          return instance.log(3, `ReBars: document.querySelector("${selector}") could not be found on the document`);

        const scope = {
          $app,
          methods,
          data,
        };

        Utils.registerPartials({ instance, scope, partials });
        Utils.registerHelpers({ instance, helpers, scope });
        Helpers.register({ instance, template, store, scope });

        scope.data = ProxyTrap.create(scope, changed => {
          instance.log(Config.logLevel(), "ReBars: change", changed);
          ReRender.paths({ changed, store, instance });
          Object.entries(watch).forEach(([path, fn]) => {
            if (Utils.shouldRender(changed, [path])) fn.call(Utils.buildContext(scope.data, scope));
          });
        });

        Garbage.start($app, store);
        if (hooks.beforeRender) await hooks.beforeRender(Utils.buildContext(scope.data, scope));
        $app.innerHTML = templateFn(scope.data);
      },
    };
  },
};
