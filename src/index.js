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
      helpers,
      $el,
      components: {
        registered: {},
        instances: {},
      },
    };

    Utils.dom.observeEl($el, (added, removed) => {
      added.forEach($node => Utils.dom.handleNewNode($node, app));
    });

    const rootInst = Component.register(app, root).instance();
    $el.innerHTML = rootInst.render();
    rootInst.attached();
    return app;
  },
};
