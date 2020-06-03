import Msg from "../msg.js";
import Constants from "../constants.js";
const { attrs } = Constants;

export default {
  recordState($target) {
    const $active = document.activeElement;
    const ref = $active.getAttribute(attrs.ref);

    if (!$target.contains($active) || !ref) return null;
    return {
      ref,
      scrollTop: $active.scrollTop,
      scrollLeft: $active.scrollLeft,
      selectionStart: $active.selectionStart,
    };
  },

  getMethodArr($el) {
    const attr = $el.getAttribute(attrs.method);
    return attr ? JSON.parse(attr) : null;
  },

  listeners({ $el, methods, action, recursive = true, handler }) {
    if ($el.nodeType === Node.TEXT_NODE) return;

    const data = this.getMethodArr($el);
    if (data) $el[`${action}EventListener`](data[0], handler);

    if (recursive)
      $el
        .querySelectorAll(`[${attrs.method}]`)
        .forEach($node => this.listeners({ ...arguments[0], $el: $node, recursive: false }));
  },

  restoreState($target, activeRef) {
    if (!activeRef) return;

    const $input = this.findRef($target, activeRef.ref);
    if (!$input) return;

    if (Array.isArray($input)) {
      Msg.warn(
        `ref="${activeRef.ref}" is used more than once. Focus cannot be restored. If using bind, add a ref="uniqeName" to each usage`,
        $input
      );
    } else {
      $input.focus();
      if (activeRef.selectionStart) {
        const pos = $input.tagName === "TEXTAREA" ? activeRef.selectionStart : activeRef.selectionStart + 1;
        $input.setSelectionRange(pos, pos);
      }

      $input.scrollTop = activeRef.scrollTop;
      $input.scrollLeft = activeRef.scrollLeft;
    }
  },

  findRef: ($target, ref) => {
    if ($target.getAttribute(attrs.ref) === ref) return $target;
    return $target.querySelector(`[${attrs.ref}="${ref}"]`);
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

  findWatcher: id => document.querySelector(`[${attrs.watch}="${id}"]`),

  propStr: props =>
    Object.entries(props)
      .map(([key, val]) => {
        if (typeof val === "number") return `${key}=${val}`;
        else return `${key}="${val}"`;
      })
      .join(" "),

  wrapWatcher(id, html, hash) {
    const { tag, ...props } = { ...{ tag: "span" }, ...hash };
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
