import Msg from "./msg.js";
import Utils from "./utils/index.js";

export default {
  register({ app, instance, components, helpers, template, methods, name }) {
    Object.entries(helpers).forEach(([name, fn]) => instance.registerHelper(name, fn));
    instance.registerHelper("isComponent", cName => Object.keys(components).includes(cName));

    instance.registerHelper("component", function(...args) {
      const { hash: props, loc } = args.pop();
      const cName = args[0];
      if (!components[cName]) Msg.fail(`${name}: child component "${cName}" is not registered`, { template, loc });
      return new instance.SafeString(components[cName].instance(props).render());
    });

    instance.registerHelper("debug", (obj, { hash, data, loc }) => {
      if (obj === undefined) Msg.fail(`${name}: undefined passed to debug`, { template, loc });
      return new instance.SafeString(`<pre class="debug" ${Utils.dom.propStr(hash)}>${Utils.stringify(obj)}</pre>`);
    });

    instance.registerHelper("watch", function(...args) {
      const { fn, hash, data, loc } = args.pop();
      const instId = data.root.$_componentId;

      const eId = Utils.randomId();

      const _getPath = (target, wildcard = true) => {
        if (target === undefined) Msg.fail(`${name}: undefined cannot be watched`, { template, loc });
        return typeof target === "object" ? `${target.ReBarsPath}.*` : target;
      };

      const path = args
        .map(_getPath)
        .join(".")
        .split(",");

      const renders = app.components.instances[instId].renders;

      renders[eId] = {
        path,
        render: () => fn(this),
      };

      return Utils.dom.wrapWatcher(eId, fn(this), hash);
    });

    instance.registerHelper("method", function() {
      const [str, ...args] = arguments;
      const [methodName, type = "click"] = str.split(":");
      const { data, loc } = args.pop();

      if (!(methodName in methods))
        Msg.fail(`${name}: "${methodName}" is not a method in component`, { template, loc });

      const props = { "data-rbs-method": [data.root.$_componentId, type, methodName] };
      if (args && args.length) props["data-rbs-method"] = props["data-rbs-method"].concat(args);
      return new instance.SafeString(Utils.dom.propStr(props));
    });

    instance.registerHelper("bound", (path, { hash = {}, data, loc }) => {
      const { $_componentId } = data.root;
      const params = [$_componentId, path];
      let value;

      try {
        value = !path.includes(".")
          ? data.root[path]
          : path.split(".").reduce((pointer, seg) => pointer[seg], data.root);
      } catch (err) {
        Msg.fail(`${name}: bound helper was passed a bad path`, { template, loc });
      }

      const props = {
        value,
        ref: hash.ref || path,
        "data-rbs-bound": params,
      };

      return new instance.SafeString(Utils.dom.propStr(props));
    });
  },
};
