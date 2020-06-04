import Msg from "./msg.js";
import Helpers from "./helpers.js";
import ReRender from "./re-render.js";
import ProxyTrap from "./proxy-trap.js";
import Utils from "./utils/index.js";

export default {
  app({ helpers = {}, template, data = {}, refs = {}, methods = {}, Handlebars = window.Handlebars, trace = false }) {
    const instance = Handlebars.create();
    const templateFn = instance.compile(template);
    const store = { renders: {} };

    Msg.setTrace(trace);

    Helpers.register({ instance, template, helpers, store, methods });

    return {
      instance,
      render($app) {
        const scope = {
          $refs: () => Utils.dom.findRefs($app),
          $app,
          data,
        };

        scope.methods = Utils.bind(methods, scope);

        scope.data = Object.entries(scope.data).reduce((scoped, [key, value]) => {
          if (typeof value === "function" && scoped.hasOwnProperty(key)) scoped[key] = value.bind(scope);
          return scoped;
        }, data);

        scope.data = ProxyTrap.create(data, paths => {
          Msg.log(`data changed "${paths}"`, store.renders);
          ReRender.paths({ paths, renders: store.renders });
        });

        function handler(event) {
          const [type, methodName, ...rest] = Utils.dom.getMethodArr(event.currentTarget);
          scope.methods[methodName](event, ...rest);
        }

        const observer = new MutationObserver(mutationList => {
          mutationList.forEach(({ addedNodes, removedNodes }) => {
            addedNodes.forEach($el => Utils.dom.listeners({ $el, methods: scope.methods, handler, action: "add" }));
            removedNodes.forEach($el =>
              Utils.dom.listeners({ $el, methods: scope.methods, handler, action: "remove" })
            );
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
