import Watcher from "./watcher.js";
import Helpers from "./helpers.js";
import Utils from "./utils.js";

export default {
  component({
    template,
    data = {},
    components = {},
    methods = {},
    parentData = {},
    props = {},
    hooks = {},
    Handlebars = window.Handlebars,
  }) {
    if (!Handlebars) throw new Error("Vbars need Handlebars in order to run!");

    const id = Utils.randomId();
    const instance = Handlebars.create();

    // need to call created before building the proxy
    if (hooks.created) hooks.created(...arguments);

    const proxyData = Watcher(data, ({ path }) => {
      const globalRef = window[Utils.name].components[id];

      console.log("Vbars update:", path);

      Object.keys(globalRef.renders).forEach(eId => {
        const handler = globalRef.renders[eId];

        if (Utils.shouldRender(path, handler.path)) {
          const $target = Utils.findComponent(eId);
          if ($target) {
            $target.innerHTML = handler.render();
            console.log($target);
          } else {
            delete globalRef[eId];
          }
        }
      });

      setTimeout(() => {
        Object.keys(window[Utils.name].components).forEach(cId => {
          if (!Utils.findComponent(cId)) {
            console.log("Vbars", `removing handlers, and renders for ${cId}`);
            delete window[Utils.name].components[cId];
          }
        });
      }, 100);
    });

    const templateFn = instance.compile(template);

    Helpers.register({ id, instance, methods, components, proxyData, parentData, props });

    if ("attached" in hooks) {
      const int = setInterval(() => {
        if (Utils.findComponent(id)) {
          clearInterval(int);
          hooks.attached({
            ...{ methods, data: proxyData, parentData, props },
            ...{ $refs: Utils.findRefs(id) },
          });
        }
      }, 100);
    }

    return Utils.wrapTemplate(id, templateFn(data));
  },
};
