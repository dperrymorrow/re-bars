import Utils from "./utils/index.js";
import Patch from "./utils/patch.js";
import Config from "./config.js";

export default {
  paths({ changed, store, instance }) {
    Object.entries(store.renders)
      .filter(([renderId, handler]) => {
        return Utils.shouldRender(changed, handler.path) && Utils.dom.findWatcher(renderId);
      })
      .forEach(([renderId, handler]) => {
        const $target = Utils.dom.findWatcher(renderId);
        // if we cant find the target, we should not attempt to re-renders
        // this can probally be cleaned up with clearing orphans on the app

        if (!$target) return;

        Utils.garbage(store);

        const html = handler.render();
        const stash = Utils.dom.recordState($target);

        if (!Patch.hasChanged($target, html)) return;

        if (Patch.canPatch($target)) {
          instance.log(Config.logLevel(), "ReBars: patching", handler.path, $target);
          Patch.compare({ $target, html, instance, store });
          Utils.dom.restoreState($target, stash);
          return;
        }

        // warn for not having a ref on array update
        const lenPath = handler.path.find(path => path.endsWith(".length"));
        if (lenPath)
          instance.log(
            2,
            "ReBars: add a {{ ref someUniqueKey }} to each to avoid re-rendering the entire Array",
            handler.path,
            $target
          );

        $target.style.display = html === "" ? "none" : "";
        $target.innerHTML = html;

        Utils.dom.restoreState($target, stash);
        instance.log(Config.logLevel(), "ReBars: render", handler.path, $target);
      });
  },
};
