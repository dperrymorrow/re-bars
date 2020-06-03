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

    const proxy = ProxyTrap.create(data, paths => {
      Msg.log(`data changed "${paths}"`, store.renders);
      ReRender.paths({ paths, renders: store.renders });
    });

    Helpers.register({ instance, template, helpers, store, methods });

    return {
      instance,
      render($app) {
        const scope = {
          data: proxy,
          methods,
          refs,
          $refs: () => Utils.dom.findRefs($app),
          $app,
        };

        function handler(event) {
          const [type, methodName, ...rest] = Utils.dom.getMethodArr(event.currentTarget);
          scope.methods[methodName](event, ...rest);
        }

        scope.methods = Utils.bind(scope.methods, scope);
        scope.refs = Utils.bind(scope.refs, scope);

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

        $app.innerHTML = templateFn(proxy);
      },
    };
  },
};
