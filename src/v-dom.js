import Utils from "./utils.js";

export default function({ id, templateFn, proxyData, parentData }) {
  const $el = document.createElement("div");

  function render() {
    $el.innerHTML = templateFn({ ...proxyData, ...{ parent: parentData } });
    if ($el.children.length !== 1)
      throw new Error(`template must have exactly one root node ${$el.innerHTML}`);
    $el.children[0].dataset.vbarsComp = id;
    return $el.innerHTML;
  }

  function _swapNodes($source, $target) {
    const $clone = $source.cloneNode(true);
    $target.parentNode.replaceChild($clone, $target);
  }

  function _addChild($container, $child) {
    const $clone = $child.cloneNode(true);
    $container.appendChild($clone);
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
        _swapNodes($v, $e);
      }
    });
    // this is items that were added via push
    Utils.keyedChildren($vNode).forEach($v => {
      const $e = $realNode.querySelector(`[data-vbars-key="${$v.dataset.vbarsKey}"]`);
      if (!$e) {
        console.log("could not find real node, adding", $v);
        _addChild($realNode, $v);
      }
    });

    console.groupEnd();
  }

  function patch(path) {
    const $target = Utils.findComponent(id);
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
          _swapNodes($vNode, $real);
        }
      });

    console.groupEnd();
  }

  return {
    $el,
    render,
    patch,
  };
}
