import Utils from "./utils/index.js";
import ProxyTrap from "./proxy-trap.js";
import Helpers from "./helpers.js";
import ReRender from "./re-render.js";
import Constants from "./constants.js";
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

      const $listeners = Object.entries($props).reduce((listeners, [key, handler]) => {
        if (key.startsWith(Constants.listenerPrefix)) {
          listeners[key.replace(Constants.listenerPrefix, "")] = handler;
          $props[key].delete;
        }
        return listeners;
      }, {});

      let hasCreated = false;

      const scope = ProxyTrap.create(
        {
          ...instData,
          ...{
            $props,
            $methods: methods,
            $listeners,
            $emit: (key, data = {}) => {
              if ($listeners[key]) $listeners[key](data);
            },
            $name: name,
            $_componentId: id,
            $el: () => Utils.dom.findComponent(id),
            $refs: () => Utils.dom.findRefs(id),
          },
        },
        paths => {
          if (!hasCreated) return;
          Msg.log(`${name}: data changed "${paths}"`, renders);
          // watchers...
          Object.entries(watchers)
            .reduce((capture, [key, handler]) => {
              if (paths.some(path => Utils.shouldRender(path, key.split(",")))) capture.push(handler);
              return capture;
            }, [])
            .forEach(handler => handler.call(scope));

          ReRender.paths({ app, paths, renders, name });
        }
      );

      if (hooks.created) hooks.created.call(scope);

      // gotta delay this or it will fire immediately, before the que triggers
      Utils.debounce(() => {
        hasCreated = true;
      })();

      const compInst = {
        id,
        scope,
        hooks,
        renders,
        handlers: {
          bound(event) {
            const [id, path] = event.currentTarget.dataset.rbsBound.split(",");
            Utils.setKey(scope, path, event.target.value);
          },
          method(event) {
            const [id, type, method, ...args] = event.currentTarget.dataset.rbsMethod.split(",");
            if (method === "$emit") scope.$emit(args[0], scope[args[0]]);
            else scope.$methods[method].call(scope, event, ...args);
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
