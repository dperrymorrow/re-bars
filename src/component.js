import Utils from "./utils/index.js";
import ProxyTrap from "./proxy-trap.js";
import Helpers from "./helpers.js";
import ReRender from "./re-render.js";
import Msg from "./msg.js";

const restricted = ["component", "ref", "debug", "isComponent", "method", "bound", "watch", "isComponent"];

function register(
  { id: appId, Handlebars, trace, helpers: globalHelpers, components: globalComponents },
  { name, template, data = () => ({}), helpers = {}, hooks = {}, methods = {}, watchers = {}, components = [] }
) {
  // should prob init Msg with the trace per app
  if (!name) Msg.fail("noName", null, arguments[1]);
  if (typeof data !== "function") Msg.fail("dataFn", { name });
  if (typeof template !== "string") Msg.fail("tmplStr", { name });

  const app = arguments[0];
  const instance = Handlebars.create();
  const templateFn = instance.compile(template);

  const regComps = components.reduce(
    (regs, def) => {
      const reg = register(app, def);
      regs[def.name] = reg;
      return regs;
    },
    { ...globalComponents.registered }
  );

  Object.keys(data()).forEach(key => {
    if (restricted.concat(Object.keys(helpers)).includes(key)) Msg.fail("restrictedKey", { name, key });
  });

  Helpers.register({
    app,
    methods,
    instance,
    name,
    helpers: { ...helpers, ...globalHelpers },
    components: regComps,
    template,
  });

  return {
    instance($props = {}) {
      const id = Utils.randomId();
      const instData = data();
      const renders = {};
      // validate the props, add the passed methods after you bind them or you will loose scope
      Object.entries($props).forEach(([key, value]) => {
        if (value === undefined) Msg.warn("propUndef", { name, key });
      });

      const scope = ProxyTrap.create(
        {
          ...instData,
          ...{
            $props,
            $methods: methods,
            $name: name,
            $_componentId: id,
            $el: () => Utils.dom.findComponent(id),
            $refs: () => Utils.dom.findRefs(id),
          },
        },
        paths => {
          Msg.log("triggered", { name, paths }, renders);
          ReRender.paths({ app, paths, renders, name });
        }
      );

      if (hooks.created) hooks.created.call(scope);

      const compInst = {
        id,
        scope,
        hooks,
        renders,
        handlers: {
          bound(event) {
            const [id, path] = event.target.dataset.rbsBound.split(",");
            Utils.setKey(scope, path, event.target.value);
          },
          method(event) {
            const [id, type, method, ...args] = event.target.dataset.rbsMethod.split(",");
            scope.$methods[method](event, ...args);
          },
        },
        detached() {
          if (hooks.detached) hooks.detached.call(scope);
        },
        attached() {
          if (hooks.attached) hooks.attached.call(scope);
        },
        render() {
          return Utils.dom.tagComponent(id, templateFn(scope), name);
        },
      };

      app.components.instances[id] = compInst;
      return compInst;
    },
  };
}

export default {
  register,
};
