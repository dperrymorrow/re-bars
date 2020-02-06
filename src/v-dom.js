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
    Utils.keyedChildren($realNode).forEach($e => {
      const $v = $vNode.querySelector(`[data-key="${$e.dataset.key}"]`);
      // has been deleted
      if (!$v) $e.remove();
      else if (!$v.isEqualNode($e)) {
        // needs replaced, has changed
        const $updated = Utils.swapNodes($v, $e);
        Events.add($updated);
      }
    });
    // this is items that were added via push
    Utils.keyedChildren($vNode).forEach($e => {
      const $real = $realNode.querySelector(`[data-key="${$e.dataset.key}"]`);
      if (!$real) {
        const $newNode = Utils.addChild($realNode, $e);
        Events.add($newNode);
      }
    });
  }

  function patch($target, path) {
    render();

    Array.from($el.querySelectorAll("[data-vbars-watch]"))
      .filter($e => path.startsWith($e.dataset.vbarsWatch))
      .forEach($vNode => {
        const $real = $target.querySelector(`[data-vbars-id="${$vNode.dataset.vbarsId}"]`);
        if (Utils.isKeyedNode($vNode)) {
          // console.log(`comparing keyed arrays ${path}`, $vNode);
          _compareKeys($vNode, $real);
        } else {
          // console.log(`patching ${path}`, $vNode);
          Events.add(Utils.swapNodes($vNode, $real));
        }
      });
  }

  return {
    $el,
    render,
    replace,
    patch,
  };
}
