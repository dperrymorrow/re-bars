import Utils from "../utils.js";

export default function(storage, { instance, data }) {
  const _watch = (target, render) => {
    const eId = Utils.randomId();
    if (target === null)
      throw new Error("Rebars: cannot pass null to watch helper, pass a string or Object");
    const path = typeof target === "object" ? `${target.ReBarsPath}.*` : target.split(",");

    storage.renders[eId] = { render, path };
    return eId;
  };

  instance.registerHelper("debug", function(obj) {
    const render = () => `<pre class="debug">${JSON.stringify(obj, null, 2)}</pre>`;
    const eId = _watch(obj, render);
    return new instance.SafeString(Utils.wrapTemplate(eId, render()));
  });

  instance.registerHelper("watch", function(target, { fn }) {
    const eId = _watch(target, fn.bind(null, data));
    return Utils.wrapTemplate(eId, fn(data));
  });

  instance.registerHelper("watchEach", function(arr, { fn }) {
    if (!Array.isArray(arr)) throw new Error("watchEach must be passed an Array");
    const path = arr.ReBarsPath;

    return arr.map((item, index) => {
      const eId = _watch(`${path}.${index}.*`, fn.bind(null, item));
      return Utils.wrapTemplate(eId, fn(item));
    });
  });
}
