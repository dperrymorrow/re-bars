import EventHandlers from "./event-handlers.js";
import ReRenders from "./re-renders.js";

export default function({ instance, app, id, proxyData, components }) {
  const storage = app.storage.components[id];

  ReRenders(storage, ...arguments);
  EventHandlers(storage, ...arguments);

  instance.registerHelper("component", function(name, { hash: props }) {
    return new instance.SafeString(
      app.component({
        ...components[name],
        ...{ parentData: proxyData, props },
      })
    );
  });

  instance.registerHelper("isChecked", val => (val ? "checked" : ""));
  instance.registerHelper("ref", key => new instance.SafeString(`data-rbs-ref="${key}"`));
  instance.registerHelper(
    "debug",
    obj => new instance.SafeString(`<pre class="debug">${JSON.stringify(obj, null, 2)}</pre>`)
  );
}
