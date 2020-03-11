import Utils from "./utils.js";
import Component from "./component.js";
import Errors from "./errors.js";

export default function({ $el, root, Handlebars = window.Handlebars, trace = false }) {
  if (!Handlebars) Errors.fail("noHbs");

  window.rbs = window.ReBars = window.ReBars || {};
  window.ReBars.apps = window.ReBars.apps || {};
  window.ReBars.handlers = window.ReBars.handlers || {
    trigger(...args) {
      const [appId, cId, methodName, ...params] = args;
      const scope = Utils.getStorage(appId, cId).scope;
      const method = scope.methods[methodName];
      if (!method) Errors.fail("noMethod", { name: scope.name, methodName });
      method(...params);
    },

    bound(appId, cId, event, path) {
      const scope = Utils.getStorage(appId, cId).scope;
      Utils.setKey(scope.data, path, event.target.value);
    },
  };

  const id = Utils.randomId();
  const storage = (window.ReBars.apps[id] = { cDefs: {}, inst: {}, trace });

  if (!document.body.contains($el)) Errors.fail("noEl");

  $el.innerHTML = Component.register(id, Handlebars, root)
    .instance()
    .render();

  return {
    id,
    storage,
  };
}
