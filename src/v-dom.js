import EventHandlers from "./event-handlers.js";
import Logger from "./logger.js";
import Utils from "./utils.js";

const msg = Logger("V-DOM");

export default function({ templateFn, proxyData, eventHandlers }) {
  const $el = document.createElement("div");

  // should make event handlers a factory and then it wont have to pass $root around
  let $root;

  function render() {
    $el.innerHTML = templateFn(proxyData);
    msg.log("vdom contents", $el);
  }

  function replace($target) {
    // store the root the first time we render
    $root = $target;
    render();
    $target.innerHTML = $el.innerHTML;
    EventHandlers.add({ $root, $container: $target, eventHandlers, data: proxyData });
  }

  function _compareKeys($vNode, $realNode) {
    Utils.keyedChildren($realNode).forEach($e => {
      const $v = $vNode.querySelector(`[data-key="${$e.dataset.key}"]`);
      // has been deleted
      if (!$v) $e.remove();
      else if (!$v.isEqualNode($e)) {
        // needs replaced, has changed
        const $updated = Utils.swapNodes($v, $e);
        EventHandlers.add({
          $root,
          $container: $updated,
          eventHandlers,
          data: proxyData,
        });
      }
    });
    // this is items that were added via push
    Utils.keyedChildren($vNode).forEach($e => {
      const $real = $realNode.querySelector(`[data-key="${$e.dataset.key}"]`);
      if (!$real) {
        const $newNode = Utils.addChild($realNode, $e);
        EventHandlers.add({
          $root,
          $container: $newNode,
          eventHandlers,
          data: proxyData,
        });
      }
    });
  }

  function patch($target, path) {
    render();

    Array.from($el.querySelectorAll("[data-watch]"))
      .filter($node => path.startsWith($node.dataset.watch))
      .forEach($vNode => {
        const $real = $target.querySelector(`#${$vNode.getAttribute("id")}`);
        if (Utils.isKeyedNode($vNode)) {
          msg.log(`comparing keyed arrays ${path}`, $vNode);
          _compareKeys($vNode, $real);
        } else {
          $real.innerHTML = $vNode.innerHTML;
          msg.log(`patching ${path}`, $vNode);
          EventHandlers.add({ $root: $target, $container: $real, eventHandlers, data: proxyData });
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
