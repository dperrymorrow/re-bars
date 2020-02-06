export default {
  register(instance) {
    // instance.registerHelper("watch", (path, options) => {
    //   const id = Utils.watchId(options);
    //   // wrapping in span can mess with layout, should probally have a attr helper instead of a block helper
    //   return `<span id="${id}" data-vbars-watch="${path}">${options.fn(proxyData)}</span>`;
    // });

    instance.registerHelper("watch", (path, options) => {
      const identifier = `${options.loc.start.column}${options.loc.start.line}${options.loc.end.column}${options.loc.end.line}`;
      return new instance.SafeString(`data-vbars-id="${identifier}" data-vbars-watch="${path}"`);
    });

    instance.registerHelper("handler", function() {
      const args = Array.from(arguments);
      args.splice(-1, 1);
      return new instance.SafeString(`data-vbars-handler='${JSON.stringify(args)}'`);
    });
  },
};
