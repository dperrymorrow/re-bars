import VDom from "./v-dom.js";
import Watcher from "./watcher.js";
import Helpers from "./helpers.js";
import Utils from "./utils.js";

export default {
  component({
    template,
    data: rawData = {},
    components = {},
    methods = {},
    Handlebars = window.Handlebars,
  }) {
    let init = false;
    let vDom;

    if (!Handlebars) throw new Error("Vbars need Handlebars in order to run!");

    const id = Utils.randomId();
    const instance = Handlebars.create();
    const proxyData = Watcher(rawData, ({ path }) => vDom.patch(path));
    const templateFn = instance.compile(template);

    return {
      id,
      instance,
      data: proxyData,
      render(parentData = {}) {
        if (!init) {
          vDom = VDom({ id, templateFn, proxyData, parentData });
          Helpers.register({ id, instance, methods, components, proxyData, parentData });
          init = true;
        }
        return vDom.render();
      },
    };
  },
};
