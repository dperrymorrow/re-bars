import Helpers from "./helpers.js";
import ReRender from "./re-render.js";
import ProxyTrap from "./proxy-trap.js";
import Utils from "./utils/index.js";
import Config from "./config.js";
import Garbage from "./garbage.js";

const ReBars = {
  load: Utils.loadTemplate,
  app({
    helpers = {},
    template,
    data = {},
    methods = {},
    partials = {},
    watch = {},
    hooks = {},
    Handlebars = window ? window.Handlebars : null,
    trace = false,
  }) {
    if (!Handlebars) throw new Error("ReBars: needs Handlebars in order to run");

    const instance = Handlebars.create();
    const store = { renders: {}, handlers: {} };
    Config.setTrace(trace);

    return {
      store,
      instance,
      async render(selector) {
        // takes an element or a selector
        const $app = selector.nodeType === Node.ELEMENT_NODE ? selector : document.querySelector(selector);

        if (!$app) throw new Error(`ReBars: document.querySelector("${selector}") could not be found on the document`);

        // have to make sure they are resolved first
        await Promise.all(Object.values(partials));
        Object.entries(partials).forEach(async ([name, tpl]) =>
          instance.registerPartial(name, tpl instanceof Promise ? await tpl : tpl)
        );

        // must be compiled after the partials
        const templateFn = instance.compile(template instanceof Promise ? await template : template);

        const scope = {
          $app,
          methods,
          data: typeof data === "function" ? data() : data,
        };

        Utils.registerHelpers({ instance, helpers, scope });
        Helpers.register({ instance, template, store, scope });

        scope.data = ProxyTrap.create(scope, async changed => {
          instance.log(Config.logLevel(), "ReBars: change", changed);
          ReRender.paths({ changed, store, instance });
          // have to wait a tick or anything set by a watch will not catch...
          await Utils.nextTick();
          Object.entries(watch).forEach(([path, fn]) => {
            if (Utils.shouldRender(changed, [path])) fn.call(scope.data, Utils.buildContext(scope.data, scope));
          });
        });

        Garbage.start($app, store);
        const context = Utils.buildContext(scope.data, scope);

        if (hooks.beforeRender) await hooks.beforeRender.call(scope.data, context);
        $app.innerHTML = templateFn(scope.data);
        if (hooks.afterRender) await hooks.afterRender.call(scope.data, context);

        return context;
      },
    };
  },
};

// add it to the window if we have one...
if (window) window.ReBars = window.ReBars || ReBars;
export default ReBars;
