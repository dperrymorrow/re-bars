import Utils from "../utils.js";

export default function(storage, { instance, proxyData }) {
  instance.registerHelper("watch", function(path, { fn }) {
    const eId = Utils.randomId();
    storage.renders[eId] = { render: fn.bind(null, proxyData), path };
    return Utils.wrapTemplate(eId, fn(proxyData));
  });

  instance.registerHelper("watchEach", function(arr, { fn }) {
    if (!Array.isArray(arr)) throw new Error("watchEach must be passed an Array");
    const path = arr.ReBarsPath;

    return arr.map((item, index) => {
      const eId = Utils.randomId();
      storage.renders[eId] = {
        render: fn.bind(null, item),
        path: `${path}.${index}.*`,
      };
      return Utils.wrapTemplate(eId, fn(item));
    });
  });
}
