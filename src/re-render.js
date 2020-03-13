import Utils from "./utils.js";
import Msg from "./msg.js";

function _restoreCursor($target, activeRef) {
  // this fetches all the refs, is this performant?
  const $input = Utils.findRef($target, activeRef.ref);

  if (!$input) return;
  if (Array.isArray($input)) {
    Msg.warn("focusFail", { ref: activeRef.ref, name }, $input);
  } else {
    $input.focus();
    if (activeRef.pos) $input.setSelectionRange(activeRef.pos + 1, activeRef.pos + 1);
  }
}

export default {
  init({ watchers, appId, compId, name }) {
    const cStore = Utils.getStorage(appId, compId);
    const appStore = Utils.getStorage(appId);

    function _deleteOrphans() {
      Object.keys(appStore.inst).forEach(cId => {
        if (!Utils.findComponent(cId)) delete appStore.inst[cId];
      });
      Object.keys(cStore.renders).forEach(key => {
        if (!Utils.findWatcher(key)) delete cStore.renders[key];
      });
    }

    function _patchArr($target, html, handler) {
      const $shadow = Utils.getShadow(html);
      const $vChilds = Array.from($shadow.children);

      // Msg.log("patching", { name, path }, $target);

      // do deletes + changes first so its faster
      Array.from($target.children).forEach($r => {
        const $v = Utils.findRef($shadow, $r.dataset.rbsRef);
        if (!$v) $r.remove();
        else if (!Utils.isEqHtml($v, $r)) $r.replaceWith($v.cloneNode(true));
      });

      // additions;
      $vChilds.forEach(($v, index) => {
        const ref = $v.dataset.rbsRef;
        const $r = Utils.findRef($target, ref);
        if (!$r) {
          const $prev = $target.children[index];
          if ($prev) $target.insertBefore($v.cloneNode(true), $prev);
          else $target.append($v.cloneNode(true));
        }
      });

      $vChilds.forEach(($v, index) => {
        const ref = $v.dataset.rbsRef;
        const $el = $target.children[index];
        if ($el && $el.dataset.rbsRef !== ref) {
          $target.children[index].replaceWith($v.cloneNode(true));
        }
      });
    }

    const toTrigger = { watchers: {}, renders: {}, paths: [] };

    const _patch = Utils.debounce(() => {
      _deleteOrphans();

      Msg.log("triggered", { name }, toTrigger.paths, toTrigger);

      Object.entries(toTrigger.watchers).forEach(([path, fn]) => {
        delete toTrigger.watchers[path];
        fn();
      });
      Object.entries(toTrigger.renders).forEach(([renderId, handler]) => {
        const $target = Utils.findWatcher(renderId);
        if (!$target) return;

        const html = handler.render();

        if (Utils.isEqHtml($target.innerHTML, html)) return;

        if (Utils.isKeyedNode($target)) {
          _patchArr($target, html, handler);
          Msg.log("patching", { name, path: handler.path }, $target);
          delete toTrigger.renders[renderId];
          return;
        }

        const lenPath = handler.matching.find(path => path.endsWith(".length"));
        if (lenPath) Msg.warn("notKeyed", { name, path: lenPath }, $target);

        const activeRef = {
          ref: document.activeElement.dataset.rbsRef,
          pos: document.activeElement.selectionStart,
        };

        $target.style.display = html === "" ? "none" : "";
        $target.innerHTML = html;

        _restoreCursor($target, activeRef);
        Msg.log("reRender", { name, path: handler.path }, $target);
      });

      toTrigger.paths = [];
    }, 0);

    return {
      que(path) {
        _deleteOrphans(); // narrow down the choices first

        Object.entries(watchers).forEach(([watchPath, fn]) => {
          if (Utils.shouldRender(path, watchPath)) toTrigger.watchers[watchPath] = fn;
        });

        Object.entries(cStore.renders).forEach(([id, handler]) => {
          if (Utils.shouldRender(path, handler.path)) {
            if (!(id in toTrigger.renders)) toTrigger.renders[id] = { ...handler, matching: [path] };
            toTrigger.renders[id].matching.push(path);
          }
        });

        toTrigger.paths.push(path);

        _patch();
      },
    };
  },
};
