export default {
  register({ instance, methods }) {
    function _handler() {
      const [eventType, ...args] = arguments;
      const opts = args.splice(-1, 1);

      if (args.some(arg => arg !== null && typeof arg === "object"))
        throw new Error(
          `must only pass primitives as argument to a handler. ${JSON.stringify(args, null, 2)}`
        );

      const handler = JSON.stringify({ methodName: opts[0].name, eventType, args });
      return _addData({ handler });
    }

    const _addData = pairs => {
      return new instance.SafeString(
        Object.keys(pairs)
          .map(key => `data-vbars-${key}='${pairs[key]}'`)
          .join(" ")
      );
    };

    instance.registerHelper("watch", (path, options) => {
      const id = `${options.loc.start.column}${options.loc.start.line}${options.loc.end.column}${options.loc.end.line}`;
      return _addData({ id, watch: path });
    });

    instance.registerHelper("keyed", val => _addData({ key: val }));
    instance.registerHelper("isChecked", val => (val ? "checked" : ""));
    instance.registerHelper("bind", path => _addData({ bind: path }));
    instance.registerHelper("ref", key => _addData({ ref: key }));

    Object.keys(methods).forEach(key => instance.registerHelper(key, _handler));
  },
};
