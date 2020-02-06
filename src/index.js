import Utils from "./utils.js";
import Watcher from "./watcher.js";
import VDom from "./v-dom.js";

export default {
  create({ template, data: rawData, methods = {} }) {
    let $root, vDom;

    const instance = window.Handlebars.create();

    instance.registerHelper("watch", (path, options) => {
      const id = Utils.watchId(options);
      return `<span id="${id}" data-watch="${path}">${options.fn(proxyData)}</span>`;
    });

    instance.registerHelper("handler", function() {
      const args = Array.from(arguments);
      args.splice(-1, 1);
      return new instance.SafeString(`data-vbar-handler='${JSON.stringify(args)}'`);
    });

    const templateFn = instance.compile(template);

    const proxyData = Watcher(rawData, ({ path }) => {
      vDom.patch($root, path);
    });

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
