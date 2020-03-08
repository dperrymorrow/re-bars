import Utils from "./utils.js";
import ProxyTrap from "./proxy-trap.js";
import Helpers from "./helpers.js";

function create(
  appId,
  Handlebars,
  { name, template, data, helpers = {}, hooks = {}, methods = {}, watchers = {}, components = [] }
) {
  const appStore = Utils.getStorage(appId);

  data =
    data ||
    function() {
      return {};
    };

  if (!name) throw new Error("Each ReBars component should have a name");
  if (typeof data !== "function") throw new Error(`component:${name} data must be a function`);
  if (typeof template !== "string") throw new Error(`component:${name} needs a template string`);

  const instance = Handlebars.create();
  const templateFn = instance.compile(template);

  components.forEach(def => {
    if (!def.name) throw new Error("component needs a name", def);
    if (!appStore.cDefs[def.name]) appStore.cDefs[def.name] = create(appId, Handlebars, def);
  });

  Helpers.register(appId, { instance, methods, helpers, name, components });

  return {
    render($props = {}) {
      const compId = Utils.randomId();
      const scope = { $props, methods, name, watchers, data: data(), $refs: () => Utils.findRefs(compId) };

      scope.methods = Object.entries(methods).reduce((bound, [name, method]) => {
        bound[name] = method.bind(scope);
        return bound;
      }, {});

      // validate the props, add the passed methods after you bind them or you will loose scope
      Object.entries($props).forEach(([key, value]) => {
        if (value === undefined) console.warn(`component:${name} was passed undefined for prop '${key}'`);
        if (typeof value === "function") {
          scope.methods[key] = value;
          delete $props[key];
        }
        if (key in scope.data)
          console.warn(`component:${name} prop ${key} was overrode with ${scope.data[key]} from data`);
      });

      scope.watchers = Object.entries(watchers).reduce((bound, [name, method]) => {
        bound[name] = method.bind(scope);
        return bound;
      }, {});

      appStore.inst[compId] = {
        scope,
        renders: {},
      };

      if (hooks.created) hooks.created.call(scope);

      const proxyInst = ProxyTrap.create({ ...scope, ...{ appId, compId } });
      scope.data = proxyInst.data;
      const html = Utils.tagComponent(compId, templateFn(scope.data), name);
      proxyInst.watch();
      return html;
    },
  };
}

export default {
  create,
};
