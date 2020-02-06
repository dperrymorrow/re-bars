import EventHandlers from "./event-handlers.js";
import Utils from "./utils.js";

export default function({ $root, templateFn, proxyData }) {
  const $el = document.createElement("div");
  const Events = EventHandlers(...arguments);
  const render = () => ($el.innerHTML = templateFn(proxyData));

  function replace() {
    render();
    $root.innerHTML = $el.innerHTML;
    Events.add($root);
  }

  function _compareKeys($vNode, $realNode) {
    console.groupCollapsed("comparing keyed children");
    console.log("real parent", $realNode);
    console.log("virtual parent", $vNode);

    Utils.keyedChildren($realNode).forEach($e => {
      const $v = $vNode.querySelector(`[data-vbars-key="${$e.dataset.vbarsKey}"]`);
      if (!$v) {
        console.log("removing keyed node", $e);
        $e.remove();
      } else if (!$v.isEqualNode($e)) {
        console.log("swapping real", $e);
        console.log("with virual", $v);
        Events.add(Utils.swapNodes($v, $e));
      }
    });
    // this is items that were added via push
    Utils.keyedChildren($vNode).forEach($v => {
      const $e = $realNode.querySelector(`[data-vbars-key="${$v.dataset.vbarsKey}"]`);
      if (!$e) {
        console.log("could not find real node, adding", $v);
        Events.add(Utils.addChild($realNode, $v));
      }
    });

    console.groupEnd();
  }

  function patch($target, path) {
    console.groupCollapsed(`vDOM patching ${path}`);
    render();

    Array.from($el.querySelectorAll("[data-vbars-watch]"))
      .filter($e => path.startsWith($e.dataset.vbarsWatch))
      .forEach($vNode => {
        const $real = $target.querySelector(`[data-vbars-id="${$vNode.dataset.vbarsId}"]`);
        if (Utils.isKeyedNode($vNode)) {
          _compareKeys($vNode, $real);
        } else {
          console.log("replacing", $real);
          console.log("with", $vNode);
          Events.add(Utils.swapNodes($vNode, $real));
        }
      });

    console.groupEnd();
  }

  return {
    $el,
    render,
    replace,
    patch,
  };
}
