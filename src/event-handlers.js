import Logger from "./logger.js";
import Utils from "./utils.js";
const msg = Logger("Event Handlers");

export default function({ $root, methods, proxyData }) {
  return {
    add($container) {
      $container.querySelectorAll("[data-vbar-handler]").forEach($el => {
        const [eventStr, ...rest] = JSON.parse($el.dataset.vbarHandler);
        const [eventType, methodName] = eventStr.split(":");
        let [listener, ...augs] = eventType.split(".");

        if (!(methodName in methods)) {
          msg.warn(`${methodName} not in event methods`, methods);
          return;
        }

        // gonna have to store this to remove them when patching
        $el.addEventListener(listener, event => {
          if (augs.includes("prevent")) {
            event.stopPropagation();
            event.preventDefault();
          }
          methods[methodName]({ event, data: proxyData, $root, $container }, ...rest);
        });
        delete $el.dataset.vbarHandler;
      });

      $container.querySelectorAll("[data-bind]").forEach($el => {
        $el.addEventListener("input", $event => {
          Utils.setKey(proxyData, $el.dataset.bind, $event.currentTarget.value);
        });
      });
    },
  };
}
