import Utils from "./utils.js";
import OnChange from "./deps/on-change.js";
import VDom from "./v-dom.js";

export default {
  create({ template, data: rawData, eventHandlers = {} }) {
    let $root;

    const instance = window.Handlebars.create();
    const templateFn = instance.compile(template);

    const proxyData = OnChange(rawData, (...args) => {
      vDom.patch($root, ...args);
    });

    const vDom = VDom({ templateFn, proxyData, eventHandlers });

    instance.registerHelper("watch", (path, options) => {
      const id = Utils.watchId(options);
      return `<span id="${id}" data-watch="${path}">${options.fn(proxyData)}</span>`;
    });

    //
    // instance.registerHelper("each", function(context, options) {
    //   let ret = "";
    //   context.forEach(item => (ret += _hook(item, options.fn)));
    //   return ret;
    // });

    return {
      instance,
      data: proxyData,
      vDom,
      render($target) {
        $root = $target;
        vDom.replace($target);
      },
    };
  },
};
