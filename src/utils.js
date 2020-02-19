export default {
  findComponent: id => document.getElementById(id),
  wrapTemplate: (id, html) => `<span id="${id}">${html}</span>`,

  findRefs(id) {
    return Array.from(this.findComponent(id).querySelectorAll("[data-vbars-ref]")).reduce(
      (obj, $el) => {
        obj[$el.dataset.vbarsRef] = $el;
        return obj;
      },
      {}
    );
  },

  shouldRender(path, watchPath) {
    if (path === watchPath) return true;
    return this.getWildCard(path) === watchPath;
  },

  getWildCard(path) {
    const segs = path.split(".").slice(0, -1);
    segs.push("*");
    return segs.join(".");
  },

  randomId: () =>
    "_" +
    Math.random()
      .toString(36)
      .substr(2, 9),

  setKey(obj, path, value) {
    const arr = path.split(".");
    arr.reduce((pointer, key, index) => {
      if (!(key in pointer)) throw new Error(`${path} was not found in object`, obj);
      if (index + 1 === arr.length) pointer[key] = value;
      return pointer[key];
    }, obj);
  },
};
