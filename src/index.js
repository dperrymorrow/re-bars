import Utils from "./utils/index.js";
import Component from "./component.js";
import Msg from "./msg.js";

export default {
  app({ $el, root, Handlebars = window.Handlebars, trace = false }) {
    if (!Handlebars) Msg.fail("noHbs");

    window.rbs = window.ReBars = window.ReBars || {};
    window.ReBars.apps = window.ReBars.apps || {};
    window.ReBars.trace = trace;
    window.ReBars.handlers = window.ReBars.handlers || {
      trigger(...args) {
        const [appId, cId, methodName, ...params] = args;
        const scope = Utils.getStorage(appId, cId).scope;
        const method = scope.$methods[methodName];
        if (!method) Msg.fail("noMethod", { name: scope.$name, methodName });
        method(...params);
      },

      bound(appId, cId, event, path) {
        const { scope } = Utils.getStorage(appId, cId);
        Utils.setKey(scope, path, event.target.value);
      },
    };

    const id = Utils.randomId();
    const storage = (window.ReBars.apps[id] = { cDefs: {}, inst: {} });

    if (!document.body.contains($el)) Msg.fail("noEl");

    $el.innerHTML = Component.register(id, Handlebars, root)
      .instance()
      .render();

    return {
      id,
      storage,
    };
  },
};
