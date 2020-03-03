import Watcher from "./watcher.js";
import Helpers from "./helpers/index.js";
import Utils from "./utils.js";

export default function({ $el, root, Handlebars = window.Handlebars }) {
  if (!Handlebars) throw new Error("ReBars need Handlebars in order to run!");

  window.ReBars = window.ReBars || {};
  window.ReBars.apps = window.ReBars.apps || {};
  window.rbs = window.ReBars;

  const appId = Utils.randomId();
  const storage = (window.ReBars.apps[appId] = { comp: {} });
  const app = { component, id: appId, storage };

  $el.innerHTML = component(root);

  function component({
    template,
    methods = {},
    props = {},
    name,
    components = {},
    data: rawData,
    watchers = {},
    helpers = {},
  }) {
    const id = Utils.randomId();
    const instance = Handlebars.create();

    if (!name) throw new Error("Each ReBars component should have a name");

    storage.comp[id] = {
      renders: {},
      ev: {},
      name,
    };

    const proxyData = Watcher({ id, app, props, methods, rawData, watchers, name });
    const templateFn = instance.compile(template);

    Helpers({
      props,
      methods,
      id,
      components,
      instance,
      helpers,
      data: proxyData,
      name,
      app,
    });

    return Utils.tagComponent(app.id, id, templateFn(proxyData), name);
  }

  return {
    component,
    storage,
  };
}
