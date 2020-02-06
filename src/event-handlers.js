import Utils from "./utils.js";

export default function({ $root, methods, proxyData }) {
  return {
    add($container) {
      $container.querySelectorAll("[data-vbars-handler]").forEach($el => {
        const [eventStr, ...rest] = JSON.parse($el.dataset.vbarsHandler);
        const [eventType, methodName] = eventStr.split(":");
        let [listener, ...augs] = eventType.split(".");

        if (!(methodName in methods))
          throw new Error(`${methodName} not in event methods`, methods);

        // gonna have to store this to remove them when patching
        $el.addEventListener(listener, event => {
          if (augs.includes("prevent")) {
            event.stopPropagation();
            event.preventDefault();
          }
          methods[methodName]({ event, data: proxyData, $root, $container }, ...rest);
        });
        delete $el.dataset.vbarsHandler;
      });

      $container.querySelectorAll("[data-vbars-bind]").forEach($el => {
        $el.addEventListener("input", $event => {
          Utils.setKey(proxyData, $el.dataset.vbarsBind, $event.currentTarget.value);
        });
      });
    },
  };
}
