import Utils from "./utils.js";
import Watcher from "./watcher.js";
import Helpers from "./helpers.js";

function create(appId, { name, template, data, helpers = {}, methods = {}, watchers = {}, components = [] }) {
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
    if (!appStore.cDefs[def.name]) appStore.cDefs[def.name] = create(appId, def);
  });

  Helpers.register(appId, { instance, helpers, name, components });

  return {
    render(props = {}) {
      const id = Utils.randomId();
      const scope = { props, methods, name, watchers };

      scope.methods = Object.entries(methods).reduce((bound, [name, method]) => {
        bound[name] = method.bind(scope);
        return bound;
      }, {});

      scope.watchers = Object.entries(watchers).reduce((bound, [name, method]) => {
        bound[name] = method.bind(scope);
        return bound;
      }, {});

      appStore.inst[id] = {
        scope,
        renders: {},
      };

      const proxyData = Watcher.create(appId, { methods, data, watchers: scope.watchers, name, ...{ id, props } });
      scope.data = proxyData;
      return Utils.tagComponent(id, templateFn(proxyData), name);
    },
  };
}

export default {
  create,
};
