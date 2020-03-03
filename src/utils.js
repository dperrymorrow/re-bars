let counter = 1;

export default {
  findWatcher: id => document.querySelector(`[data-rbs-watch="${id}"]`),
  wrapWatcher: (id, html, hash) => {
    const { tag, ...props } = { ...{ tag: "span", class: "rbs-watch" }, ...hash };
    const propStr = Object.entries(props)
      .map(([key, val]) => `${key}="${val}"`)
      .join(" ");

    return `<${tag} ${propStr} data-rbs-watch="${id}">${html}</${tag}>`;
  },

  tagComponent(appId, id, html, name) {
    const $tmp = document.createElement("div");
    $tmp.innerHTML = html;
    const $root = $tmp.firstElementChild;
    if ($tmp.children.length > 1 || $root.dataset.rbsWatch)
      throw new Error(`component:'${name}' must have one root node, and cannot be a {{#watch}}`);

    $root.dataset.rbsComp = id;
    return $tmp.innerHTML;
  },

  findComponent: id => document.querySelector(`[data-rbs-comp="${id}"]`),

  findRefs(parent) {
    const $el = typeof parent === "object" ? parent : this.findComponent(parent);

    return Array.from($el.querySelectorAll("[data-rbs-ref]")).reduce((obj, $el) => {
      const key = $el.dataset.rbsRef;
      const target = obj[$el.dataset.rbsRef];
      obj[key] = target ? [target].concat($el) : $el;
      return obj;
    }, {});
  },

  findByPath: (data, path) => path.split(".").reduce((pointer, seg) => pointer[seg], data),
  getPath: (appId, compId) => `rbs.apps.${appId}.comp.${compId}`,

  shouldRender(path, watch) {
    const watchPaths = Array.isArray(watch) ? watch : [watch];
    return watchPaths.some(watchPath => {
      if (path === watchPath || watchPath === ".*") return true;

      const pathSegs = path.split(".");
      const watchSegs = watchPath.split(".");

      return watchSegs.every((seg, index) => {
        if (seg === pathSegs[index] || seg === "*") return true;
        return false;
      });
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
