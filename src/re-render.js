import Utils from "./utils/index.js";
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
        // TODO: this should not be needed if garbage is collected well
        if (!$target) return;

        const html = handler.render();
        // cursor position focused element ect...
        const stash = Utils.dom.recordState($target);
        // we dont want wrappers to show up with no content
        $target.style.display = html === "" ? "none" : "";
        $target.innerHTML = html;
        // restore saved state of DOM
        Utils.dom.restoreState($target, stash);
        instance.log(Config.logLevel(), "ReBars: render", handler.path, $target);
      });
  },
};
