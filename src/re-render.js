import Utils from "./utils.js";

function _restoreCursor($target, activeRef) {
  // this fetches all the refs, is this performant?
  const $input = Utils.findRef($target, activeRef.ref);

  if (!$input) return;
  if (Array.isArray($input)) {
    console.warn(
      `component:${name} ref ${activeRef.ref} is used more than once. Focus cannot be restored. If using bind, add a ref="uniqeName" to each`
    );
  } else {
    $input.focus();
    if (activeRef.pos) $input.setSelectionRange(activeRef.pos + 1, activeRef.pos + 1);
  }
}

export default {
  init({ watchers, appId, compId, name }) {
    const cStore = Utils.getStorage(appId, compId);
    const appStore = Utils.getStorage(appId);

    function _checkWatchers(path) {
      Object.entries(watchers).forEach(([watch, fn]) => {
        if (Utils.shouldRender(path, watch)) fn();
      });
    }

    function _deleteOrphans() {
      Object.keys(appStore.inst).forEach(cId => {
        if (!Utils.findComponent(cId)) delete appStore.inst[cId];
      });
      Object.keys(cStore.renders).forEach(key => {
        if (!Utils.findWatcher(key)) delete cStore.renders[key];
      });
    }

    function _patchArr($target, html) {
      const $shadow = Utils.getShadow(html);
      const $vChilds = Array.from($shadow.children);

      // do deletes + changes first so its faster
      Array.from($target.children).forEach($r => {
        const $v = Utils.findRef($shadow, $r.dataset.rbsRef);
        if (!$v) $r.remove();
        else if (!Utils.isEqHtml($v, $r)) $r.replaceWith($v.cloneNode(true));
      });
      // additions;

      $vChilds.forEach(($v, index) => {
        const $r = Utils.findRef($target, $v.dataset.rbsRef);
        if (!$r) {
          const $prev = $target.children[index];
          if ($prev) $target.insertBefore($v.cloneNode(true), $prev);
          else $target.prepend($v.cloneNode(true));
        }
      });
      // sorting
      $vChilds
        .reduce((arr, $v) => {
          arr.push(Utils.findRef($target, $v.dataset.rbsRef));
          return arr;
        }, [])
        .forEach(($el, index) => {
          if (!$target.children[index].isEqualNode($el)) $target.children[index].replaceWith($el.cloneNode(true));
        });
    }

    return {
      patch(path) {
        _deleteOrphans();
        _checkWatchers(path);

        Object.entries(cStore.renders).forEach(([renderId, handler]) => {
          if (!Utils.shouldRender(path, handler.path)) return;

          const $target = Utils.findWatcher(renderId);
          if (!$target) return;
          const html = handler.render();

          if (Utils.isKeyedNode($target)) {
            _patchArr($target, html, path);
            return;
          } else if (path.endsWith(".length")) {
            console.warn(
              `component:${name} patching ${path} if you add a ref to each item in the array it will be much faster`
            );
          }

          if (Utils.isEqHtml($target.innerHTML, html)) return;

          const activeRef = {
            ref: document.activeElement.dataset.rbsRef,
            pos: document.activeElement.selectionStart,
          };

          $target.style.display = html === "" ? "none" : "";
          $target.innerHTML = html;

          _restoreCursor($target, activeRef);
          console.log(`component:${name} ${path}`, $target);
        });
      },
    };
  },
};
