import Watcher from "./watcher.js";
import Helpers from "./helpers.js";
import Utils from "./utils.js";

export default function({ $el, name, root, Handlebars = window.Handlebars }) {
  if (!Handlebars) throw new Error("ReBars need Handlebars in order to run!");

  const storage = { components: {} };
  $el.innerHTML = component(root);

  function component({
    template,
    data = {},
    components = {},
    methods = {},
    parentData = {},
    props = {},
    hooks = {},
  }) {
    const id = Utils.randomId();
    const instance = Handlebars.create();

    // need to call created before building the proxy
    if (hooks.created) hooks.created(...arguments);

    storage.components[id] = {
      handlers: {},
      renders: {},
    };

    const proxyData = Watcher({ rawData: data, storage, id });
    const templateFn = instance.compile(template);

    Helpers.register({
      id,
      app: { storage, component, name },
      instance,
      methods,
      components,
      proxyData,
      parentData,
      props,
    });

    if ("attached" in hooks) {
      const int = setInterval(() => {
        if (Utils.findComponent(id)) {
          clearInterval(int);
          hooks.attached({
            ...{ methods, data: proxyData, parentData, props },
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
