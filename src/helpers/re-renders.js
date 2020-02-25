import Utils from "../utils.js";

export default function(storage, { instance, proxyData }) {
  instance.registerHelper("watch", function(path, { fn }) {
    if (path === null)
      throw new Error("Rebars: cannot pass null to watch helper, pass a string or Object");

    if (typeof path === "object") {
      path = `${path.ReBarsPath}.*`;
      console.log(path);
    }
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
