import Utils from "../utils.js";

export default function(storage, { proxyData, instance, methods, id, watchers, props, app }) {
  const handlerPath = `ReBars.apps.${app.id}.components.${id}.handlers`;

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

    return new instance.SafeString(`on${eventType}="${handlerPath}.action(${params.join(",")})"`);
  }

  storage.handlers.bind = (event, path) => Utils.setKey(proxyData, path, event.currentTarget.value);

  storage.handlers.action = function() {
    const [key, ...args] = arguments;

    return methods[key].call(
      null,
      {
        methods,
        watchers,
        data: proxyData,
        props,
        $refs: Utils.findRefs(id),
        event,
      },
      ...args
    );
  };

  instance.registerHelper("method", _handler);
  instance.registerHelper(
    "bind",
    path => new instance.SafeString(`oninput="${handlerPath}.bind(event, '${path}')"`)
  );
}
