import Utils from "../utils.js";

export default function(storage, { data, instance, methods, id, props, app, name }) {
  const handlerPath = `rbs.apps.${app.id}.comp.${id}.ev`;

  function _handler() {
    const [str, ...args] = arguments;
    const [methodName, eventType = "click"] = str.split(":");
    args.splice(-1, 1);

    const params = [methodName].concat(args).map(param => {
      if (param !== null && typeof parm === "object")
        throw new Error(
          `must only pass primitives as argument to a handler. ${JSON.stringify(args, null, 2)}`
        );
      if (typeof param === "string") return `'${param}'`;
      return param;
    });

    return new instance.SafeString(
      `on${eventType}="${handlerPath}.method(event, ${params.join(",")})"`
    );
  }

  storage.ev.bind = (event, path) => Utils.setKey(data, path, event.currentTarget.value);
  storage.ev.method = function() {
    const [event, key, ...args] = arguments;

    if (!(key in methods))
      throw new Error(`${key} was not found in methods for component '${name}'`);

    return methods[key].call(
      methods,
      { data, props, methods, $refs: Utils.findRefs(id) },
      event,
      ...args
    );
  };

  instance.registerHelper("method", _handler);
  instance.registerHelper(
    "bind",
    path => new instance.SafeString(`oninput="${handlerPath}.bind(event, '${path}')"`)
  );
}
