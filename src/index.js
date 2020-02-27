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
  const app = { storage, component, id: appId };

  $el.innerHTML = component(root);

  function component({
    template,
    components = {},
    methods = {},
    props = {},
    hooks = {},
    watchers = {},
    data = {},
    name,
  }) {
    const id = Utils.randomId();
    const instance = Handlebars.create();

    if (!name) throw new Error("Each ReBars component should have a name");

    storage.comp[id] = {
      renders: {},
      ev: {},
      hooks,
      name,
    };

    if (hooks.created) hooks.created(...arguments);
    // need to call created before building the proxy
    const proxyData = Watcher({ id, app, props, data, watchers, name });
    const templateFn = instance.compile(template);

    Helpers({
      id,
      instance,
      app,
      methods,
      components,
      proxyData,
      props,
      watchers,
    });

    if ("attached" in hooks) {
      const int = setInterval(() => {
        if (Utils.findComponent(id)) {
          clearInterval(int);
          hooks.attached({
            ...{ watchers, methods, data: proxyData, props },
            ...{ $refs: Utils.findRefs(id) },
          });
        }
      }, 10);
    }

    return Utils.wrapTemplate(id, templateFn(proxyData));
  }

  return {
    component,
    storage,
  };
}
