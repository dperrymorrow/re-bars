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
        if (!$target) return;

        const html = handler.render();
        // cursor position focused element ect...
        const stash = Utils.dom.recordState($target);

        if (!Patch.hasChanged($target, html)) return;

        if (Patch.canPatch($target)) {
          instance.log(Config.logLevel(), "ReBars: patching", handler.path, $target);
          Patch.compare({ $target, html, instance, store });
          Utils.dom.restoreState($target, stash);
          return;
        }

        // we dont want wrappers to show up with no content
        $target.style.display = html === "" ? "none" : "";
        $target.innerHTML = html;
        // restore saved state of DOM
        Utils.dom.restoreState($target, stash);
        instance.log(Config.logLevel(), "ReBars: re-render", handler.path, $target);
      });
  },
};
