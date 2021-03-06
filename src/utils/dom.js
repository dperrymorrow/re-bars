import Config from "../config.js";
const { attrs } = Config;

export default {
  recordState($target) {
    const $active = document.activeElement;
    const ref = $active.getAttribute(attrs.ref);

    if (!$target.contains($active) || !ref) return null;
    return {
      ref,
      style: $active.getAttribute("style"),
      scrollTop: $active.scrollTop,
      scrollLeft: $active.scrollLeft,
      selectionStart: $active.selectionStart,
    };
  },

  restoreState($target, activeRef) {
    if (!activeRef) return;

    const $input = this.findAttr(attrs.ref, activeRef.ref, $target);
    if (!$input) return;

    $input.focus();
    if (activeRef.selectionStart) {
      const pos = $input.tagName === "TEXTAREA" ? activeRef.selectionStart : activeRef.selectionStart + 1;
      $input.setSelectionRange(pos, pos);
    }

    $input.scrollTop = activeRef.scrollTop;
    $input.scrollLeft = activeRef.scrollLeft;
    if (activeRef.style) $input.setAttribute("style", activeRef.style);
  },

  findRefs($root) {
    const { ref } = attrs;
    const $refs = Array.from($root.querySelectorAll(`[${ref}]`));

    return $refs.reduce((obj, $el) => {
      const key = $el.getAttribute(ref);
      const target = obj[key];
      obj[key] = target ? [target].concat($el) : $el;
      return obj;
    }, {});
  },

  // use this in place of all the others that are repeated eventually...
  findAttr(attr, val, $target = null) {
    const $container = $target || document;
    // check top level
    if ($target && $target.getAttribute(attr) === val) return $target;
    return $container.querySelector(`[${attr}="${val}"]`);
  },

  findMethod: id => document.querySelector(`[${attrs.method}="${id}"]`),
  findWatcher: id => document.querySelector(`[${attrs.watch}="${id}"]`),
  isTextNode: $el => $el.nodeType === Node.TEXT_NODE,

  propStr: props =>
    Object.entries(props)
      .map(([key, val]) => {
        if (typeof val === "number") return `${key}=${val}`;
        else return `${key}="${val}"`;
      })
      .join(" "),

  wrapWatcher(id, html, hash) {
    const { tag, ...props } = { tag: "span", ...hash };
    const propStr = this.propStr(props);
    const style = !html.length ? "style='display:none;'" : "";
    return `<${tag} ${propStr} ${style} ${attrs.watch}="${id}">${html}</${tag}>`;
  },

  getShadow(html) {
    const $tmp = document.createElement("div");
    $tmp.innerHTML = html;
    return $tmp;
  },
};
