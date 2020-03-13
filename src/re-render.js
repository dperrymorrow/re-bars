import Utils from "./utils.js";
import Msg from "./msg.js";

export default {
  init({ watchers, appId, compId, name }) {
    const cStore = Utils.getStorage(appId, compId);

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
      Utils.deleteOrphans(appId, compId);
      Msg.log("triggered", { name, paths: toTrigger.paths }, toTrigger);

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

        Utils.restoreCursor($target, activeRef);
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
