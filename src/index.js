import Utils from "./utils.js";
import Component from "./component.js";

export default function({ $el, root, Handlebars = window.Handlebars }) {
  if (!Handlebars) throw new Error("ReBars need Handlebars in order to run!");

  window.rbs = window.ReBars = window.ReBars || {};
  window.ReBars.apps = window.ReBars.apps || {};
  window.ReBars.handlers = window.ReBars.handlers || {
    trigger(...args) {
      const [appId, cId, methodName, ...params] = args;
      const scope = Utils.getStorage(appId, cId).scope;
      const method = scope.methods[methodName];
      if (!method) throw new Error(`component:${scope.name} ${methodName} is not a defined method`);
      method(...params);
    },

    bound(appId, cId, event, path) {
      const scope = Utils.getStorage(appId, cId).scope;
      Utils.setKey(scope.data, path, event.target.value);
    },
  };

  const id = Utils.randomId();
  const storage = (window.ReBars.apps[id] = { cDefs: {}, inst: {} });

  if (!document.body.contains($el)) throw new Error("$el must be present in the document");

  $el.innerHTML = Component.create(id, Handlebars, root).render();

  return {
    id,
    storage,
  };
}
