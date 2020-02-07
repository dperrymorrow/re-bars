import VDom from "./v-dom.js";
import Watcher from "./watcher.js";
import Helpers from "./vbars-helpers.js";

export default {
  create({ template, data: rawData, methods = {}, Handlebars = window.Handlebars }) {
    let $root, vDom;

    if (!Handlebars) throw new Error("Vbars need Handlebars in order to run!");

    const instance = Handlebars.create();
    const proxyData = Watcher(rawData, ({ path }) => vDom.patch($root, path));
    Helpers.register({ instance, methods });
    const templateFn = instance.compile(template);

    return {
      VbarsComponent: true,
      instance,
      data: proxyData,
      render($target) {
        $root = $target;
        vDom = VDom({ $root, templateFn, proxyData, methods });
        vDom.replace();
      },
    };
  },
};
