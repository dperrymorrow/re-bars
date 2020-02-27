import Utils from "../utils.js";

export default function(storage, { proxyData, instance, methods, id, props, app }) {
  const handlerPath = `ReBars.apps.${app.id}.comp.${id}.ev`;

  function _handler() {
    const [eventType, methodName, ...args] = arguments;
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

  storage.ev.bind = (event, path) => Utils.setKey(proxyData, path, event.currentTarget.value);
  storage.ev.method = function() {
    const [event, key, ...args] = arguments;

    return methods[key].call(
      methods,
      { data: proxyData, props, methods, $refs: Utils.findRefs(id) },
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
