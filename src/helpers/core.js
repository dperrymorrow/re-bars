import Utils from "../utils/index.js";
import Msg from "../msg.js";

export default {
  register(instance, helpers) {
    Object.entries(helpers).forEach(([name, fn]) => instance.registerHelper(name, fn));

    instance.registerHelper("component", function(cName, { hash: props, data }) {
      const { cDefs } = Utils.getStorage(data.root.$_appId);
      if (!cDefs[cName]) Msg.fail("noComp", { name: data.root.$name, cName });
      return new instance.SafeString(cDefs[cName].instance(props).render());
    });

    instance.registerHelper("isComponent", function(cName, { data }) {
      const { cDefs } = Utils.getStorage(data.root.$_appId);
      return Object.keys(cDefs).includes(cName);
    });

    instance.registerHelper("ref", key => new instance.SafeString(`data-rbs-ref="${key}"`));
  },
};
