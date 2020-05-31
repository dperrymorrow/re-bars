import Msg from "./msg.js";
import Helpers from "./helpers.js";
import ReRender from "./re-render.js";
import ProxyTrap from "./proxy-trap.js";

export default {
  app({ helpers = {}, template, data = {}, refs = {}, methods = {}, Handlebars = window.Handlebars }) {
    const instance = Handlebars.create();
    const templateFn = instance.compile(template);
    const store = { renders: {} };

    const proxy = ProxyTrap.create(data, paths => {
      Msg.log(`${name}: data changed "${paths}"`, store.renders);
      ReRender.paths({ paths, renders: store.renders });
    });

    Helpers.register({ instance, template, helpers, store });

    return {
      instance,
      store,
      render($app) {
        const scope = {
          data: proxy,
          methods,
          $app,
        };

        Object.keys(methods).forEach(key => (methods[key] = methods[key].bind(scope)));

        function _checkForRef($el, status) {
          const ref = $el.getAttribute("ref");
          if (ref && refs[ref]) refs[ref].call(scope, $el, status);
        }

        const observer = new MutationObserver(mutationList => {
          mutationList.forEach(({ addedNodes, removedNodes }) => {
            addedNodes.forEach($node => {
              if ($node.nodeType === Node.TEXT_NODE) return;
              _checkForRef($node, "added");
              $node.querySelectorAll("[ref]").forEach($node => _checkForRef($node, "attached"));
            });

            removedNodes.forEach($node => {
              if ($node.nodeType === Node.TEXT_NODE) return;
              _checkForRef($node, "remove");
              $node.querySelectorAll("[ref]").forEach($node => _checkForRef($node, "detached"));
            });
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
