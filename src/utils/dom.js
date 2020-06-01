import Msg from "../msg.js";
import Constants from "../constants.js";

export default {
  recordState($target) {
    const $active = document.activeElement;
    const ref = $active.getAttribute(Constants.attrs.ref);

    if (!$target.contains($active) || !ref) return null;
    return {
      ref,
      scrollTop: $active.scrollTop,
      scrollLeft: $active.scrollLeft,
      selectionStart: $active.selectionStart,
    };
  },

  listeners($el, methods, action, recursive = true) {
    if ($el.nodeType === Node.TEXT_NODE) return;
    let method;
    const attr = $el.getAttribute(Constants.attrs.method);
    if (attr) {
      const [type, name] = attr.includes(":") ? attr.split(":") : `click:${attr}`.split(":");
      method = { type, name };
    }

    if (method) $el[`${action}EventListener`](method.type, methods[method.name]);
    if (recursive)
      $el
        .querySelectorAll(`[${Constants.attrs.method}]`)
        .forEach($node => this.listeners($node, methods, action, false));
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
    if ($target.getAttribute(Constants.attrs.ref) === ref) return $target;
    return $target.querySelector(`[${Constants.attrs.ref}="${ref}"]`);
  },

  findRefs($root) {
    const attr = Constants.attrs.ref;
    const $refs = Array.from($root.querySelectorAll(`[${attr}]`));

    return $refs.reduce((obj, $el) => {
      const key = $el.getAttribute(attr);
      const target = obj[key];
      obj[key] = target ? [target].concat($el) : $el;
      return obj;
    }, {});
  },

  findWatcher: id => document.querySelector(`[${Constants.attrs.watch}="${id}"]`),

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
    return `<${tag} ${propStr} ${style} ${Constants.attrs.watch}="${id}">${html}</${tag}>`;
  },

  getShadow(html) {
    const $tmp = document.createElement("div");
    $tmp.innerHTML = html;
    return $tmp;
  },
};
