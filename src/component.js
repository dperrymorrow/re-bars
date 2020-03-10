import Utils from "./utils.js";
import ProxyTrap from "./proxy-trap.js";
import Helpers from "./helpers.js";
import Errors from "./errors.js";

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

  if (!name) Errors.fail("noName", { def: arguments[2] });
  if (typeof data !== "function") Errors.fail("dataFn", { name });
  if (typeof template !== "string") Errors.fail("tmplStr", { name });

  const instance = Handlebars.create();
  const templateFn = instance.compile(template);

  components.forEach(def => {
    if (!def.name) Errors.fail("noName", { def });
    if (!appStore.cDefs[def.name]) appStore.cDefs[def.name] = register(appId, Handlebars, def);
  });

  Helpers.register(appId, { instance, methods, helpers, name, components });

  return {
    instance($props = {}) {
      const compId = Utils.randomId();
      const scope = { $props, methods, hooks, name, watchers, data: data(), $refs: () => Utils.findRefs(compId) };

      scope.methods = Object.entries(methods).reduce((bound, [name, method]) => {
        bound[name] = method.bind(scope);
        return bound;
      }, {});

      // validate the props, add the passed methods after you bind them or you will loose scope
      Object.entries($props).forEach(([key, value]) => {
        if (value === undefined) Errors.warn("propUndef", { name, key });
        if (typeof value === "function") {
          scope.methods[key] = value;
          delete $props[key];
        }

        if (key in scope.data) {
          Errors.warn("propStomp", { name, key });
        }
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

      return {
        ...scope,
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
