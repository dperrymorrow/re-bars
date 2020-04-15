import Utils from "./utils/index.js";
import Msg from "./msg.js";
import Patch from "./utils/patch.js";

export default {
  paths({ app, paths, renders, name }) {
    Object.entries(renders)
      .filter(([renderId, handler]) => {
        const matches = paths.some(path => Utils.shouldRender(path, handler.path));
        return matches && Utils.dom.findWatcher(renderId);
      })
      .forEach(([renderId, handler]) => {
        const $target = Utils.dom.findWatcher(renderId);
        const html = handler.render();

        if (!Patch.hasChanged($target, html)) return;

        if (Patch.canPatch($target)) {
          Patch.compare({ app, $target, html });
          Msg.log("patching", { name, path: handler.path }, $target);
          return;
        }

        // warn for not having a ref on array update
        const lenPath = handler.path.find(path => path.endsWith(".length"));
        if (lenPath) Msg.warn("notKeyed", { name, path: lenPath }, $target);

        const activeRef = {
          ref: document.activeElement.getAttribute("ref"),
          pos: document.activeElement.selectionStart,
        };

        $target.style.display = html === "" ? "none" : "";
        $target.innerHTML = html;

        Utils.dom.restoreCursor($target, activeRef);
        Msg.log("reRender", { name, path: handler.path }, $target);
      });

    app.deleteOrphans();
  },
};
