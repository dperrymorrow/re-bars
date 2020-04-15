import Utils from "./utils/index.js";
import Component from "./component.js";
import Msg from "./msg.js";

export default {
  app({ $el, root, Handlebars = window.Handlebars, helpers = {}, components = {}, trace = false }) {
    if (!Handlebars) Msg.fail("noHbs");
    if (!document.body.contains($el)) Msg.fail("noEl");

    const app = {
      id: Utils.randomId(),
      Handlebars,
      trace,
      listening: true,
      helpers,
      $el,

      deleteOrphans: Utils.debounce(() => {
        Object.keys(app.components.instances).forEach(id => {
          if (!Utils.dom.findComponent(id)) delete app.components.instances[id];
        });
      }),

      components: {
        registered: {},
        instances: {},
      },
    };

    const _comp = (action, $el) => {
      const method = action === "add" ? "attached" : "detached";
      const cId = $el.dataset.rbsComp;
      app.components.instances[cId][method]();
    };
    const _method = (action, $method) => {
      const method = action === "add" ? "addEventListener" : "removeEventListener";
      const [cId, type] = JSON.parse($method.dataset.rbsMethod);
      $method[method](type, app.components.instances[cId].handlers.method);
    };
    const _bound = (action, $bound) => {
      const method = action === "add" ? "addEventListener" : "removeEventListener";
      const [cId, path] = JSON.parse($bound.dataset.rbsBound);
      $bound[method]("input", app.components.instances[cId].handlers.bound);
    };

    const observer = new MutationObserver(mutationList => {
      mutationList.forEach(({ addedNodes, removedNodes }) => {
        addedNodes.forEach($node => {
          if ($node.nodeType === Node.TEXT_NODE) return;

          if ($node.dataset.rbsComp) _comp("add", $node);
          if ($node.dataset.rbsMethod) _method("add", $node);
          if ($node.dataset.rbsBound) _bound("add", $node);

          $node.querySelectorAll("[data-rbs-comp]").forEach(_comp.bind(null, "add"));
          $node.querySelectorAll("[data-rbs-method]").forEach(_method.bind(null, "add"));
          $node.querySelectorAll("[data-rbs-bound]").forEach(_bound.bind(null, "add"));
        });

        removedNodes.forEach($node => {
          if ($node.nodeType === Node.TEXT_NODE) return;

          if ($node.dataset.rbsMethod) _method("remove", $node);
          if ($node.dataset.rbsBound) _bound("remove", $node);
          if ($node.dataset.rbsComp) _comp("remove", $node);

          $node.querySelectorAll("[data-rbs-method]").forEach(_method.bind(null, "remove"));
          $node.querySelectorAll("[data-rbs-bound]").forEach(_bound.bind(null, "remove"));
          $node.querySelectorAll("[data-rbs-comp]").forEach(_comp.bind(null, "remove"));
        });
      });
    });

    observer.observe($el, {
      childList: true,
      attributes: true,
      subtree: true,
    });

    const rootInst = Component.register(app, root).instance();
    $el.innerHTML = rootInst.render();
    return app;
  },
};
