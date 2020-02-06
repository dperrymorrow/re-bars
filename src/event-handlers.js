import Utils from "./utils.js";

export default function({ $root, methods, proxyData }) {
  return {
    add($container) {
      console.groupCollapsed("adding event handlers");
      console.log("container", $container);

      $container.querySelectorAll("[data-vbars-handler]").forEach($el => {
        const { eventType, methodName, args } = JSON.parse($el.dataset.vbarsHandler);
        let [listener, ...augs] = eventType.split(".");

        console.log({ listener, augs, methodName, $el });

        // gonna have to store this to remove them when patching
        $el.addEventListener(listener, event => {
          if (augs.includes("prevent")) {
            event.stopPropagation();
            event.preventDefault();
          }

          const $refs = Array.from($root.querySelectorAll("[data-vbars-ref]")).reduce(
            (obj, $el) => {
              obj[$el.dataset.vbarsRef] = $el;
              return obj;
            },
            {}
          );

          methods[methodName]({ event, data: proxyData, $root, $refs }, ...args);
        });
      });

      $container.querySelectorAll("[data-vbars-bind]").forEach($el => {
        $el.addEventListener("input", $event => {
          Utils.setKey(proxyData, $el.dataset.vbarsBind, $event.currentTarget.value);
        });
      });

      console.groupEnd();
    },
  };
}
