import Watcher from "./watcher.js";
import Helpers from "./helpers/index.js";
import Utils from "./utils.js";

window.ReBars = window.ReBars || {};
window.ReBars.apps = window.ReBars.apps || {};

export default function({ $el, root, Handlebars = window.Handlebars }) {
  if (!Handlebars) throw new Error("ReBars need Handlebars in order to run!");

  const appId = Utils.randomId();
  const storage = (window.ReBars.apps[appId] = { components: {} });
  const app = { storage, component, id: appId };

  $el.innerHTML = component(root);

  function component({
    template,
    components = {},
    methods = {},
    parentData = {},
    props = {},
    hooks = {},
    watchers = {},
    data = {},
    name,
  }) {
    const id = Utils.randomId();
    const instance = Handlebars.create();

    if (!name) throw new Error("Each ReBars component should have a name");

    storage.components[id] = {
      handlers: {},
      renders: {},
      hooks,
    };

    // need to call created before building the proxy
    if (hooks.created) hooks.created(...arguments);
    const proxyData = Watcher({ id, app, parentData, props, data, watchers, name });
    const templateFn = instance.compile(template);

    Helpers({
      id,
      instance,
      app,
      methods,
      components,
      proxyData,
      parentData,
      props,
      watchers,
    });

    if ("attached" in hooks) {
      const int = setInterval(() => {
        if (Utils.findComponent(id)) {
          clearInterval(int);
          hooks.attached({
            ...{ watchers, methods, data: proxyData, parentData, props },
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
