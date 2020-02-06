import Watcher from "./watcher.js";
import VDom from "./v-dom.js";
import Helpers from "./vbars-helpers.js";

export default {
  create({ template, data: rawData, methods = {} }) {
    let $root, vDom;

    const instance = window.Handlebars.create();
    const proxyData = Watcher(rawData, ({ path }) => vDom.patch($root, path));
    Helpers.register(instance, proxyData);
    const templateFn = instance.compile(template);

    return {
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
