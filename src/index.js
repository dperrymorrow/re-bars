import Watcher from "./watcher.js";
import Helpers from "./helpers.js";
import Utils from "./utils.js";

export default function({ $el, name, root, Handlebars = window.Handlebars }) {
  if (!Handlebars) throw new Error("ReBars need Handlebars in order to run!");

  const storage = { components: {} };
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
  }) {
    const id = Utils.randomId();
    const instance = Handlebars.create();
    const app = { storage, component, name };

    storage.components[id] = {
      handlers: {},
      renders: {},
      hooks,
    };

    // need to call created before building the proxy
    if (hooks.created) hooks.created(...arguments);
    const proxyData = Watcher({ id, app, parentData, props, data, watchers });
    const templateFn = instance.compile(template);

    Helpers.register({
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

    return Utils.wrapTemplate(id, templateFn(data));
  }

  return {
    component,
    storage,
  };
}
