import VDom from "./v-dom.js";
import Watcher from "./watcher.js";
import Helpers from "./helpers.js";
import Utils from "./utils.js";

export default {
  create({
    template,
    data: rawData,
    components = {},
    methods = {},
    Handlebars = window.Handlebars,
  }) {
    if (!Handlebars) throw new Error("Vbars need Handlebars in order to run!");

    const id = Utils.randomId();
    const instance = Handlebars.create();
    const proxyData = Watcher(rawData, ({ path }) => vDom.patch(path));

    Helpers.register({ id, instance, methods, components, proxyData });

    const templateFn = instance.compile(`<span id="${id}">${template}</span>`);
    const vDom = VDom({ id, templateFn, proxyData, methods });

    return {
      VbarsComponent: true,
      instance,
      id,
      data: proxyData,
      render() {
        return templateFn(proxyData);
      },
    };
  },
};
