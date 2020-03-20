import Utils from "../utils/index.js";
import Msg from "../msg.js";

export default {
  register(instance, helpers, template) {
    Object.entries(helpers).forEach(([name, fn]) => instance.registerHelper(name, fn));

    instance.registerHelper("component", function(...args) {
      const { hash: props, data, loc } = args.pop();
      const { cDefs } = Utils.getStorage(data.root.$_appId);

      const cName = args[0];
      if (!cDefs[cName]) Msg.fail("noComp", { data, loc, template, cName });
      return new instance.SafeString(cDefs[cName].instance(props).render());
    });

    instance.registerHelper("isComponent", function(cName, { data }) {
      const { cDefs } = Utils.getStorage(data.root.$_appId);
      return Object.keys(cDefs).includes(cName);
    });

    instance.registerHelper("ref", key => new instance.SafeString(`data-rbs-ref="${key}"`));

    instance.registerHelper("debug", (obj, { data, loc }) => {
      if (obj === undefined) Msg.fail("paramUndef", { template, data, loc });
      const parser = (key, val) => (typeof val === "function" ? val + "" : val);
      return new instance.SafeString(`<pre class="debug">${JSON.stringify(obj, parser, 2)}</pre>`);
    });
  },
};
