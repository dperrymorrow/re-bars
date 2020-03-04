import Component from "../component.js";
import Utils from "../utils.js";

export default {
  register(appId, { instance, helpers, name, components }) {
    const appStore = Utils.getStorage(appId);

    components.forEach(def => {
      if (!def.name) throw new Error("component needs a name", def);
      if (!appStore.cDefs[def.name]) appStore.cDefs[def.name] = Component.create(appId, def);
    });

    instance.registerHelper("component", function(cName, { hash: props }) {
      const cDefs = Utils.getStorage(appId).cDefs;

      Object.entries(props).forEach(([key, val]) => {
        if (typeof val === "function")
          throw new Error(`cannot pass a function as a prop. in '${name}' child '${cName}' prop '${key}'`);
      });

      if (!cDefs[cName]) throw new Error(`component:${name} child component ${cName} is not registered`);

      return new instance.SafeString(cDefs[cName].render(props));
    });

    Object.entries(helpers).forEach(([name, fn]) => instance.registerHelper(name, fn));
    instance.registerHelper("ref", key => new instance.SafeString(`data-rbs-ref="${key}"`));
  },
};
