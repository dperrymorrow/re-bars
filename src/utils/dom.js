import Msg from "../msg.js";

export default {
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

  findWatcher: id => document.querySelector(`[data-rbs-watch="${id}"]`),

  wrapWatcher: (id, html, hash) => {
    const { tag, ...props } = { ...{ tag: "span", class: "rbs-watch" }, ...hash };
    const propStr = Object.entries(props)
      .map(([key, val]) => `${key}="${val}"`)
      .join(" ");

    const style = !html.length ? "style='display:none;'" : "";
    return `<${tag} ${propStr} ${style} data-rbs-watch="${id}">${html}</${tag}>`;
  },

  isKeyedNode: $target => $target.children.length && Array.from($target.children).every($el => $el.dataset.rbsRef),
  normalizeHtml: html => html.replace(new RegExp(/="rbs(.*?)"/g), ""),

  isEqHtml(item1, item2) {
    const $n1 = typeof item1 === "string" ? this.getShadow(item1) : this.getShadow(item1.innerHTML);
    const $n2 = typeof item2 === "string" ? this.getShadow(item2) : this.getShadow(item2.innerHTML);
    $n1.innerHTML = this.normalizeHtml($n1.innerHTML);
    $n2.innerHTML = this.normalizeHtml($n2.innerHTML);

    return $n1.isEqualNode($n2);
  },

  getShadow(html) {
    const $tmp = document.createElement("div");
    $tmp.innerHTML = html;
    return $tmp;
  },

  handleNewNode($node, app) {
    const _comp = $el => app.components.instances[$el.dataset.rbsComp].init();
    const _method = $method => {
      const [method, type, cId, ...args] = JSON.parse($method.dataset.rbsMethod);
      const { scope } = app.components.instances[cId];
      $method.addEventListener(type, event => {
        scope.$methods[method].call(scope, event, ...args);
      });
    };

    if ($node.nodeType === Node.TEXT_NODE) return;
    if ($node.dataset.rbsComp) _comp($node);
    if ($node.dataset.rbsMethod) _method($node);

    $node.querySelectorAll("[data-rbs-comp]").forEach(_comp);
    $node.querySelectorAll("[data-rbs-method]").forEach(_method);
  },

  observeEl($el, callback) {
    const observer = new MutationObserver(mutationList =>
      mutationList.forEach(({ addedNodes, removedNodes }) => callback(addedNodes, removedNodes))
    );

    observer.observe($el, {
      childList: true,
      attributes: true,
      subtree: true,
    });

    return observer;
  },
};
