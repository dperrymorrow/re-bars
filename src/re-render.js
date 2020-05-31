import Utils from "./utils/index.js";
import Msg from "./msg.js";
import Patch from "./utils/patch.js";

export default {
  paths({ paths, renders }) {
    Object.entries(renders)
      .filter(([renderId, handler]) => {
        const matches = paths.some(path => Utils.shouldRender(path, handler.path));
        return matches && Utils.dom.findWatcher(renderId);
      })
      .forEach(([renderId, handler]) => {
        const $target = Utils.dom.findWatcher(renderId);
        const html = handler.render();
        const stash = Utils.dom.recordState($target);

        if (!Patch.hasChanged($target, html)) return;

        // if (Patch.canPatch($target)) {
        //   Patch.compare({ app, $target, html });
        //   Msg.log(`${name}: patching ${handler.path}`, $target);
        //   Utils.dom.restoreState($target, stash);
        //   return;
        // }

        // warn for not having a ref on array update
        const lenPath = handler.path.find(path => path.endsWith(".length"));
        if (lenPath)
          Msg.warn(
            `${name}: patching "${handler.path}" add a ref="someUniqueKey" to each to avoid re-rendering the entire Array of elements`,
            $target
          );

        $target.style.display = html === "" ? "none" : "";
        $target.innerHTML = html;

        Utils.dom.restoreState($target, stash);
        Msg.log(`${name}: re-rendering watch block for ${handler.path}`, $target);
      });
  },
};
