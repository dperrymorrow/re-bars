import Utils from "./utils/index.js";
import Config from "./config.js";
import Patch from "./utils/patch.js";

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
        // TODO: this should not be needed if garbage is collected well
        if (!$target) return;

        const html = handler.render();
        // cursor position focused element ect...
        const stash = Utils.dom.recordState($target);

        if (!Patch.hasChanged($target, html)) return;

        console.log("target", $target);

        if (Patch.canPatch($target)) {
          instance.log(Config.logLevel(), "ReBars: patching", handler.path, $target);
          Patch.compare({ $target, html, instance, store });
          Utils.dom.restoreState($target, stash);
          return;
        }

        // warn for not having a ref on array update
        const lenPath = handler.path.find(path => path.endsWith(".length") && $target.children.length > 1);
        if (lenPath)
          instance.log(
            2,
            "ReBars: add a {{ ref someUniqueKey }} to each to avoid re-rendering the entire Array",
            handler.path,
            $target
          );

        // we dont want wrappers to show up with no content
        $target.style.display = html === "" ? "none" : "";
        $target.innerHTML = html;
        // restore saved state of DOM
        Utils.dom.restoreState($target, stash);
        instance.log(Config.logLevel(), "ReBars: render", handler.path, $target);
      });
  },
};
