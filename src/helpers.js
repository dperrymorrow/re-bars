import Msg from "./msg.js";
import Utils from "./utils/index.js";

export default {
  register({ app, instance, components, helpers, template }) {
    Object.entries(helpers).forEach(([name, fn]) => instance.registerHelper(name, fn));
    instance.registerHelper("isComponent", cName => Object.keys(components).includes(cName));
    instance.registerHelper(
      "ref",
      (key, { data }) => new instance.SafeString(`data-rbs-ref="${data.root.$_componentId}:${key}"`)
    );

    instance.registerHelper("component", function(...args) {
      const { hash: props, data, loc } = args.pop();
      const cName = args[0];
      if (!components[cName]) Msg.fail("noComp", { data, loc, template, cName });
      return new instance.SafeString(components[cName].instance(props).render());
    });

    instance.registerHelper("debug", (obj, { data, loc }) => {
      if (obj === undefined) Msg.fail("paramUndef", { template, data, loc });
      const parser = (key, val) => (typeof val === "function" ? val + "" : val);
      return new instance.SafeString(`<pre class="debug">${JSON.stringify(obj, parser, 2)}</pre>`);
    });

    instance.registerHelper("watch", function(...args) {
      const { fn, hash, data, loc } = args.pop();
      const instId = data.root.$_componentId;

      const eId = Utils.randomId();

      const _getPath = (target, wildcard = true) => {
        if (target === undefined) Msg.fail("paramUndef", { template, loc, data });
        return typeof target === "object" ? `${target.ReBarsPath}${wildcard ? ".*" : ""}` : target;
      };

      const path = args
        .map(arg => _getPath(arg, false))
        .join(".")
        .split(",");

      const renders = app.components.instances[instId].renders;

      renders[eId] = {
        path,
        render: () => fn(this),
      };

      return Utils.dom.wrapWatcher(eId, fn(this), hash);
    });

    instance.registerHelper("method", function() {
      const [str, ...args] = arguments;
      const [method, type = "click"] = str.split(":");

      const { data } = args.pop();
      const { $_componentId } = data.root;
      let params = [$_componentId, type, method];
      if (args && args.length) params = params.concat(args);
      return new instance.SafeString(`data-rbs-method='${JSON.stringify(params)}'`);
    });

    instance.registerHelper("bound", (path, { hash = {}, data }) => {
      const { $_componentId } = data.root;
      const params = [$_componentId, path];

      return new instance.SafeString(
        `value="${Utils.findByPath(data.root, path)}" data-rbs-ref="${hash.ref ||
          path}" data-rbs-bound='${JSON.stringify(params)}'`
      );
    });
  },
};
