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

    const proxyData = Watcher(id, data, ({ path }) => {
      Array.from(Utils.findComponent(id).querySelectorAll("[data-vbars-watch]"))
        .filter($el => {
          const key = $el.dataset.vbarsWatch;
          if (path === key) return true;
          return Utils.getWildCard(path) === key;
        })
        .forEach($el => {
          $el.innerHTML = $el.vBarsRender(proxyData);
        });
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

    return `<span id="${id}">${templateFn(data)}</span>`;
  },
};
