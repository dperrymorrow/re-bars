import EventHandlers from "./event-handlers.js";
import ReRenders from "./re-renders.js";

export default function({ instance, app, id, components, data, helpers, name }) {
  const storage = app.storage.comp[id];

  ReRenders(storage, ...arguments);
  EventHandlers(storage, ...arguments);

  instance.registerHelper("component", function(cName, { hash: props }) {
    Object.entries(props).forEach(([key, val]) => {
      if (typeof val === "function")
        throw new Error(
          `cannot pass a function as a prop. in '${name}' child '${cName}' prop '${key}'`
        );
    });

    return new instance.SafeString(
      app.component({
        ...components[cName],
        ...{ props },
      })
    );
  });

  Object.entries(helpers).forEach(([name, fn]) =>
    instance.registerHelper(name, fn.bind(null, { instance, data }))
  );

  instance.registerHelper("ref", key => new instance.SafeString(`data-rbs-ref="${key}"`));
}
