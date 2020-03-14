let counter = 1;

import dom from "./dom.js";
import Msg from "../msg.js";

export default {
  dom,
  restoreCursor($target, activeRef) {
    const $input = this.findRef($target, activeRef.ref);

    if (!$input) return;
    if (Array.isArray($input)) {
      Msg.warn("focusFail", { ref: activeRef.ref, name }, $input);
    } else {
      $input.focus();
      if (activeRef.pos) $input.setSelectionRange(activeRef.pos + 1, activeRef.pos + 1);
    }
  },

  deleteOrphans(appId, compId) {
    const cStore = this.getStorage(appId, compId);
    const appStore = this.getStorage(appId);

    Object.keys(appStore.inst).forEach(cId => {
      if (!this.findComponent(cId)) delete appStore.inst[cId];
    });
    Object.keys(cStore.renders).forEach(key => {
      if (!this.findWatcher(key)) delete cStore.renders[key];
    });
  },

  findWatcher: id => document.querySelector(`[data-rbs-watch="${id}"]`),
  wrapWatcher: (id, html, hash) => {
    const { tag, ...props } = { ...{ tag: "span", class: "rbs-watch" }, ...hash };
    const propStr = Object.entries(props)
      .map(([key, val]) => `${key}="${val}"`)
      .join(" ");

    const style = !html.length ? "style='display:none;'" : "";

    return `<${tag} ${propStr} ${style} data-rbs-watch="${id}">${html}</${tag}>`;
  },

  isKeyedNode: $target => Array.from($target.children).every($el => $el.dataset.rbsRef),
  normalizeHtml: html => html.replace(new RegExp(/="rbs(.*?)"/g), ""),

  isEqHtml(item1, item2) {
    const $n1 = typeof item1 === "string" ? this.getShadow(item1) : this.getShadow(item1.innerHTML);
    const $n2 = typeof item2 === "string" ? this.getShadow(item2) : this.getShadow(item2.innerHTML);
    $n1.innerHTML = this.normalizeHtml($n1.innerHTML);
    $n2.innerHTML = this.normalizeHtml($n2.innerHTML);

    return $n1.isEqualNode($n2);
  },

  bindAll(scope, collection) {
    return Object.entries(collection).reduce((bound, [name, method]) => {
      bound[name] = method.bind(scope);
      return bound;
    }, {});
  },

  debounce(callback, wait, immediate = false) {
    let timeout = null;

    return function() {
      const callNow = immediate && !timeout;
      const next = () => callback.apply(this, arguments);

      clearTimeout(timeout);
      timeout = setTimeout(next, wait);

      if (callNow) {
        next();
      }
    };
  },

  getShadow(html) {
    const $tmp = document.createElement("div");
    $tmp.innerHTML = html;
    return $tmp;
  },

  tagComponent(id, html, name) {
    const $tmp = this.getShadow(html);
    const $root = $tmp.firstElementChild;

    if (!$root || !$tmp.children || $tmp.children.length > 1 || $root.dataset.rbsWatch)
      Msg.fail("oneRoot", { name }, $tmp);

    $root.dataset.rbsComp = id;
    const content = $tmp.innerHTML;
    $tmp.remove();
    return content;
  },

  getStorage(appId, cId) {
    return cId
      ? this.findByPath(window.ReBars, `apps.${appId}.inst.${cId}`)
      : this.findByPath(window.ReBars, `apps.${appId}`);
  },

  findComponent: id => document.querySelector(`[data-rbs-comp="${id}"]`),
  findRef: ($parent, ref) => $parent.querySelector(`[data-rbs-ref="${ref}"]`),

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
  getPath: (appId, compId) => `rbs.apps.${appId}.inst.${compId}`,

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

  setKey(obj, path, val) {
    const arr = path.split(".");
    arr.reduce((pointer, key, index) => {
      if (!(key in pointer)) Msg.fail("badPath", { path }, obj);
      if (index + 1 === arr.length) pointer[key] = val;
      return pointer[key];
    }, obj);
  },
};
