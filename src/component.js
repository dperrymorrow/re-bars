import Utils from "./utils/index.js";
import ProxyTrap from "./proxy-trap.js";
import Helpers from "./helpers.js";
import ReRender from "./re-render.js";
import Msg from "./msg.js";

const restricted = ["component", "ref", "debug", "isComponent", "method", "bound", "watch", "isComponent"];

// too much destructuring making it confusting with colliding names
function register(
  { id: appId, Handlebars, trace, helpers: globalHelpers, components: globalComponents },
  { name, template, data = () => ({}), helpers = {}, hooks = {}, methods = {}, watchers = {}, components = [] }
) {
  const compDef = arguments[0];

  if (!name) Msg.fail("Every ReBars component should have a name!", compDef);
  if (typeof data !== "function") Msg.fail(`${name}: component data must be a function`, compDef);
  if (typeof template !== "string") Msg.fail("`${name}: needs a template string`", compDef);

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
    if (restricted.concat(Object.keys(helpers)).includes(key))
      Msg.fail(`${name}: cannot use "${key}" in your data as it's defined as a helper`, compDef);
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
        if (value === undefined)
          Msg.warn(`${name} was passed $prop "${key}" as undefined. If you really meant to, pass null instead.`);
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
          Msg.log(`${name}: data changed "${paths}"`, renders);
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
          try {
            return Utils.dom.tagComponent(id, templateFn(scope), name);
          } catch ({ message }) {
            Msg.fail(`${name}: ${message}\n${template}`);
          }
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
