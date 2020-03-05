import Utils from "./utils.js";

function _restoreCursor($target, activeRef) {
  // this fetches all the refs, is this performant?
  const $input = Utils.findRefs($target)[activeRef.ref];

  if (!$input) return;
  if (Array.isArray($input)) {
    console.warn(
      `component:${name} ref ${activeRef.ref} is used more than once. The focus cannot be restored. If using bind, add a ref="uniqeName" to each`
    );
  } else {
    $input.focus();
    if (activeRef.pos) $input.setSelectionRange(activeRef.pos + 1, activeRef.pos + 1);
  }
}

export default {
  init({ watchers, appId, compId }) {
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

    return {
      patch(path) {
        _deleteOrphans();
        _checkWatchers(path);

        Object.entries(cStore.renders).forEach(([renderId, handler]) => {
          if (!Utils.shouldRender(path, handler.path)) return;

          const $target = Utils.findWatcher(renderId);
          if (!$target) return;

          const html = handler.render();
          if ($target.innerHTML === html) return;

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
