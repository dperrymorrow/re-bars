import Msg from "../msg.js";

export default {
  tagComponent(id, html, name) {
    const $tmp = this.getShadow(html);
    const $root = $tmp.firstElementChild;

    if (!$root) throw new Error("there was no root node. Components need a root element.");
    if (["P"].includes($root.nodeName))
      Msg.fail(`${name}: <${$root.nodeName.toLowerCase()}> cannot be a root element of for a component, try a <div>`);
    if ($tmp.children.length > 1) Msg.fail(`${name}: multiple root nodes are not allowed for a component.`);
    if ($root.dataset.rbsWatch) Msg.fail(`${name}: cannot have a watch as the root node of a component`);

    $root.dataset.rbsComp = id;
    const content = $tmp.innerHTML;
    return content;
  },

  restoreCursor($target, activeRef) {
    const $input = this.findRef($target, activeRef.ref);

    if (!$input) return;

    console.log("the input is", $input);

    if (Array.isArray($input)) {
      Msg.warn(
        `ref="${activeRef.ref}" is used more than once. Focus cannot be restored. If using bind, add a ref="uniqeName" to each usage`,
        $input
      );
    } else {
      $input.focus();
      if (activeRef.pos) $input.setSelectionRange(activeRef.pos + 1, activeRef.pos + 1);
    }
  },

  findComponent: id => document.querySelector(`[data-rbs-comp="${id}"]`),

  findRef: ($target, ref) => {
    if ($target.getAttribute("ref") === ref) return $target;
    return $target.querySelector(`[ref="${ref}"]`);
  },

  findRefs(cId) {
    const $root = this.findComponent(cId);
    const $refs = Array.from($root.querySelectorAll("[ref]"));
    if ($root.getAttribute("ref")) $refs.push($root);

    return $refs.reduce((obj, $el) => {
      const key = $el.getAttribute("ref");
      const target = obj[key];
      obj[key] = target ? [target].concat($el) : $el;
      return obj;
    }, {});
  },

  findWatcher: id => document.querySelector(`[data-rbs-watch="${id}"]`),

  propStr: props =>
    Object.entries(props)
      .map(([key, val]) => `${key}="${val}"`)
      .join(" "),

  wrapWatcher(id, html, hash) {
    const { tag, ...props } = { ...{ tag: "span" }, ...hash };
    const propStr = this.propStr(props);
    const style = !html.length ? "style='display:none;'" : "";
    return `<${tag} ${propStr} ${style} data-rbs-watch="${id}">${html}</${tag}>`;
  },

  getShadow(html) {
    const $tmp = document.createElement("div");
    $tmp.innerHTML = html;
    return $tmp;
  },
};
