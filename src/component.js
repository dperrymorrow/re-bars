import Utils from "./utils/index.js";
import ProxyTrap from "./proxy-trap.js";
import Helpers from "./helpers.js";
import Msg from "./msg.js";

function register(
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

  if (!name) Msg.fail("noName", null, arguments[2]);
  if (typeof data !== "function") Msg.fail("dataFn", { name });
  if (typeof template !== "string") Msg.fail("tmplStr", { name });

  const instance = Handlebars.create();
  const templateFn = instance.compile(template);

  components.forEach(def => {
    if (!def.name) Msg.fail("noName", null, def);
    if (!appStore.cDefs[def.name]) appStore.cDefs[def.name] = register(appId, Handlebars, def);
  });

  Helpers.register(appId, { instance, methods, helpers, name, components });

  return {
    instance($props = {}) {
      const compId = Utils.randomId();
      const scope = { $props, methods, hooks, name, watchers, data: data(), $refs: () => Utils.findRefs(compId) };

      scope.methods = Utils.bindAll(scope, methods);
      scope.watchers = Utils.bindAll(scope, watchers);

      // validate the props, add the passed methods after you bind them or you will loose scope
      Object.entries($props).forEach(([key, value]) => {
        if (value === undefined) Msg.warn("propUndef", { name, key });
        if (key in scope.data) Msg.warn("propStomp", { name, key });
        if (typeof value === "function") {
          scope.methods[key] = value;
          delete $props[key];
        }
      });

      appStore.inst[compId] = {
        scope,
        renders: {},
      };

      if (hooks.created) hooks.created.call(scope);

      const proxyInst = ProxyTrap.create({ ...scope, ...{ appId, compId } });
      scope.data = proxyInst.data;

      return {
        ...scope,
        ...{ proxyInst },
        render() {
          const html = Utils.tagComponent(compId, templateFn(scope.data), name);
          proxyInst.watch();
          return html;
        },
      };
    },
  };
}

export default {
  register,
};
