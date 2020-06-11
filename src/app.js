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

        // TODO: should be able to await nextRender()

        Helpers.register({ instance, template, store, scope });
        Utils.registerPartials(instance, scope, partials);

        // for the methods
        scope.data = Object.entries(scope.data).reduce((scoped, [key, value]) => {
          if (typeof value === "function" && scoped.hasOwnProperty(key)) scoped[key] = value.bind(scope);
          return scoped;
        }, data);

        scope.data = ProxyTrap.create(data, paths => {
          instance.log(Config.logLevel(), "ReBars: change", paths);
          ReRender.paths({ paths, renders: store.renders, instance });
        });

        const observer = new MutationObserver(mutationList => {
          mutationList.forEach(({ addedNodes, removedNodes }) => {
            removedNodes.forEach($el => {
              if ($el.nodeType === Node.TEXT_NODE) return;
              const watch = $el.getAttribute(Config.attrs.watch);
              if (watch) delete store.renders[watch];
            });
          });
        });

        observer.observe($app, {
          childList: true,
          attributes: true,
          subtree: true,
        });

        $app.innerHTML = templateFn(scope.data);
      },
    };
  },
};
