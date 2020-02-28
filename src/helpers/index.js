import EventHandlers from "./event-handlers.js";
import ReRenders from "./re-renders.js";

export default function({ instance, app, id, components = {} }) {
  const storage = app.storage.comp[id];

  ReRenders(storage, ...arguments);
  EventHandlers(storage, ...arguments);

  instance.registerHelper("component", function(name, { hash: props }) {
    return new instance.SafeString(
      app.component({
        ...components[name],
        ...{ props },
      })
    );
  });

  instance.registerHelper("isChecked", val => (val ? "checked" : ""));
  instance.registerHelper("ref", key => new instance.SafeString(`data-rbs-ref="${key}"`));
}
