import Utils from "../utils/index.js";

export default {
  register({ appId, instance, helpers, name }) {
    // component
    instance.registerHelper("component", function(cName, { hash: props }) {
      const cDefs = Utils.getStorage(appId).cDefs;
      if (!cDefs[cName]) throw new Error(`component:${name} child component ${cName} is not registered`);
      return new instance.SafeString(cDefs[cName].instance(props).render());
    });

    // add component helpers
    Object.entries(helpers).forEach(([name, fn]) => instance.registerHelper(name, fn));
    // add ref helper
    instance.registerHelper("ref", key => new instance.SafeString(`data-rbs-ref="${key}"`));
  },
};
