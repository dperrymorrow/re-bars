import Logger from "./logger.js";
import Utils from "./utils.js";
const msg = Logger("Event Handlers");

export default {
  add({ $root, $container, eventHandlers, data }) {
    $container.querySelectorAll("[data-handler]").forEach($el => {
      const [eventType, methodName] = $el.dataset.handler.split(":");
      let [listener, ...augs] = eventType.split(".");

      if (!(methodName in eventHandlers)) {
        msg.warn(`${methodName} not in event handlers`, eventHandlers);
        return;
      }

      $el.addEventListener(listener, event => {
        if (augs.includes("prevent")) {
          event.stopPropagation();
          event.preventDefault();
        }
        eventHandlers[methodName]({ event, data, $root, $container });
      });
    });

    $container.querySelectorAll("[data-bind]").forEach($el => {
      $el.addEventListener("input", $event => {
        Utils.setKey(data, $el.dataset.bind, $event.currentTarget.value);
      });
    });
  },
};
