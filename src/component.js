import Utils from "./utils/index.js";
import ProxyTrap from "./proxy-trap.js";
import Core from "./helpers/core.js";
import Events from "./helpers/events.js";
import Watch from "./helpers/watch.js";
import Msg from "./msg.js";

const restricted = ["component", "ref", "debug", "isComponent", "method", "bound", "watch", "isComponent"];

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

  Object.keys(data()).forEach(key => {
    if (restricted.concat(Object.keys(helpers)).includes(key)) Msg.fail("restrictedKey", { name, key });
  });

  Core.register(instance, { ...helpers, ...appStore.helpers });
  Events.register(instance, methods);
  Watch.register(instance);

  return {
    instance($props = {}) {
      const compId = Utils.randomId();
      const instData = data();
      // validate the props, add the passed methods after you bind them or you will loose scope
      Object.entries($props).forEach(([key, value]) => {
        if (value === undefined) Msg.warn("propUndef", { name, key });
      });

      const { data: scope, watch } = ProxyTrap.create({
        ...instData,
        ...{
          $props,
          $methods: methods,
          $hooks: hooks,
          $name: name,
          $watchers: watchers,
          $_appId: appId,
          $_componentId: compId,
          $refs: () => Utils.dom.findRefs(compId),
        },
      });

      appStore.inst[compId] = {
        scope,
        renders: {},
      };

      if (hooks.created) hooks.created.call(scope);

      return {
        scope,
        render() {
          const html = Utils.dom.tagComponent(compId, templateFn(scope), name);
          // dont begin watching until after first render
          watch();
          return html;
        },
      };
    },
  };
}

export default {
  register,
};
