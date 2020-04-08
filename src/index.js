import Utils from "./utils/index.js";
import Component from "./component.js";
import Msg from "./msg.js";

export default {
  app({ $el, root, Handlebars = window.Handlebars, helpers = {}, components = {}, trace = false }) {
    // window.rbs = window.ReBars = window.ReBars || {};
    // window.ReBars.apps = window.ReBars.apps || {};
    // window.ReBars.trace = trace;
    // window.ReBars.handlers = window.ReBars.handlers || {
    //   trigger(...args) {
    //     const [appId, cId, methodName, ...params] = args;
    //     const scope = Utils.getStorage(appId, cId).scope;
    //     const method = scope.$methods[methodName];
    //     if (!method) Msg.fail("noMethod", { name: scope.$name, methodName });
    //     method(...params);
    //   },
    //
    //   bound(appId, cId, event, path) {
    //     const { scope } = Utils.getStorage(appId, cId);
    //     Utils.setKey(scope, path, event.target.value);
    //   },
    // };

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
    rootInst.init();
    return app;
  },
};
