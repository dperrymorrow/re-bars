import Utils from "./utils/index.js";
import Patch from "./utils/patch.js";
import Config from "./config.js";

export default {
  paths({ paths, renders, instance }) {
    Object.entries(renders)
      .filter(([renderId, handler]) => {
        const matches = paths.some(path => Utils.shouldRender(path, handler.path));
        return matches && Utils.dom.findWatcher(renderId);
      })
      .forEach(([renderId, handler]) => {
        const $target = Utils.dom.findWatcher(renderId);
        // if we cant find the target, we should not attempt to re-renders
        // this can probally be cleaned up with clearing orphans on the app

        if (!$target) return;

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
          instance.log(
            2,
            `patching "${handler.path}" add a ref="someUniqueKey" to each to avoid re-rendering the entire Array of elements`,
            $target
          );

        $target.style.display = html === "" ? "none" : "";
        $target.innerHTML = html;

        Utils.dom.restoreState($target, stash);
        instance.log(Config.logLevel(), "ReBars: render", handler.path, $target);
      });
  },
};
