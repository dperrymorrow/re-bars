import Utils from "../utils.js";

const _getPath = target => {
  if (target === null)
    throw new Error("Rebars: cannot pass null to watch helper, pass a string or Object");
  return typeof target === "object" ? `${target.ReBarsPath}.*` : target;
};

export default function(storage, { instance, proxyData }) {
  instance.registerHelper("debug", function(obj) {
    const path = _getPath(obj);
    const render = () => `<pre class="debug">${JSON.stringify(obj, null, 2)}</pre>`;
    const eId = Utils.randomId();
    storage.renders[eId] = {
      render,
      path,
    };
    return new instance.SafeString(Utils.wrapTemplate(eId, render()));
  });

  instance.registerHelper("watch", function(target, { fn }) {
    const path = _getPath(target);
    const eId = Utils.randomId();
    storage.renders[eId] = {
      render: () => fn(proxyData),
      path,
    };
    return Utils.wrapTemplate(eId, fn(proxyData));
  });

  instance.registerHelper("watchEach", function(arr, { fn }) {
    if (!Array.isArray(arr)) throw new Error("watchEach must be passed an Array");
    const path = arr.ReBarsPath;

    return arr.map((item, index) => {
      const eId = Utils.randomId();
      storage.renders[eId] = {
        render: () => fn(item),
        path: `${path}.${index}.*`,
      };
      return Utils.wrapTemplate(eId, fn(item));
    });
  });
}
