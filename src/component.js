import Utils from "./utils.js";
import Watcher from "./watcher.js";
import Watch from "./helpers/watch.js";
import Core from "./helpers/core.js";
import Events from "./helpers/events.js";

function create(appId, { name, template, data, helpers = {}, methods = {}, watchers = {}, components = [] }) {
  const appStore = Utils.getStorage(appId);

  data =
    data ||
    function() {
      return {};
    };

  if (!name) throw new Error("Each ReBars component should have a name");
  if (typeof data !== "function") throw new Error(`component:${name} data must be a function`);
  if (typeof template !== "string") throw new Error("component:${name} needs a template string");

  const instance = Handlebars.create();
  const templateFn = instance.compile(template);

  Core.register(appId, { instance, helpers, name, components });
  Watch.register(appId, { instance, name });
  Events.register(appId, { instance, name });

  return {
    render(props = {}) {
      const id = Utils.randomId();
      const scope = { props, methods, name };

      scope.methods = Object.entries(methods).reduce((bound, [name, method]) => {
        bound[name] = method.bind(scope);
        return bound;
      }, {});

      appStore.inst[id] = {
        scope,
        renders: {},
      };

      const proxyData = Watcher.create(appId, { methods, data, watchers, name, ...{ id, props } });
      scope.data = proxyData;
      return Utils.tagComponent(id, templateFn(proxyData), name);
    },
  };
}

export default {
  create,
};
