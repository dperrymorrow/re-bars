import Utils from "./utils.js";
import Handlers from "./handlers.js";
import Component from "./component.js";

export default function({ $el, root, Handlebars = window.Handlebars }) {
  if (!Handlebars) throw new Error("ReBars need Handlebars in order to run!");

  window.ReBars = window.ReBars || {};
  window.ReBars.apps = window.ReBars.apps || {};
  window.ReBars.handlers = window.ReBars.handlers || Handlers;
  window.rbs = window.ReBars;

  const id = Utils.randomId();
  const storage = (window.ReBars.apps[id] = { cDefs: {}, inst: {} });

  if (!document.body.contains($el)) throw new Error("$el must be present in the document");

  $el.innerHTML = Component.create(id, root).render();

  return {
    id,
    storage,
  };
}
