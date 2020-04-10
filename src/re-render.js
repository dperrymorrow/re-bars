import Utils from "./utils/index.js";
import Msg from "./msg.js";

export default {
  paths({ paths, renders, name }) {
    Object.entries(renders)
      .filter(([renderId, handler]) => {
        const matches = paths.some(path => Utils.shouldRender(path, handler.path));
        return matches && Utils.dom.findWatcher(renderId);
      })
      .forEach(([renderId, handler]) => {
        const $target = Utils.dom.findWatcher(renderId);
        const html = handler.render();
        if (Utils.dom.isEqHtml($target.innerHTML, html)) return;

        // if (Utils.dom.isKeyedNode($target)) {
        //   _patchArr($target, html, handler);
        //   Msg.log("patching", { name, path: handler.path }, $target);
        //   delete toTrigger.renders[renderId];
        //   return;
        // }

        const lenPath = handler.path.find(path => path.endsWith(".length"));
        if (lenPath) Msg.warn("notKeyed", { name, path: lenPath }, $target);

        const activeRef = {
          ref: document.activeElement.dataset.rbsRef,
          pos: document.activeElement.selectionStart,
        };

        $target.style.display = html === "" ? "none" : "";
        $target.innerHTML = html;

        Utils.dom.restoreCursor($target, activeRef);
        Msg.log("reRender", { name, path: handler.path }, $target);
      });
  },
};
