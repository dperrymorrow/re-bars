let counter = 1;

export default {
  findComponent: id => document.getElementById(id),
  wrapTemplate: (id, html) => `<span id="${id}">${html}</span>`,

  findRefs(id) {
    return Array.from(this.findComponent(id).querySelectorAll("[data-rbs-ref]")).reduce(
      (obj, $el) => {
        obj[$el.dataset.rbsRef] = $el;
        return obj;
      },
      {}
    );
  },

  shouldRender(path, watchPath) {
    if (path === watchPath) return true;

    const pathSegs = path.split(".");
    const watchSegs = watchPath.split(".");

    return watchSegs.every((seg, index) => {
      if (seg === pathSegs[index] || seg === "*") return true;
      return false;
    });
  },

  randomId: () => `rbs${counter++}`,

  setKey(obj, path, value) {
    const arr = path.split(".");
    arr.reduce((pointer, key, index) => {
      if (!(key in pointer)) throw new Error(`${path} was not found in object`, obj);
      if (index + 1 === arr.length) pointer[key] = value;
      return pointer[key];
    }, obj);
  },
};
