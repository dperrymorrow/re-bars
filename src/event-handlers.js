import Utils from "./utils.js";

function _parseHandler($el) {
  const { eventType, methodName, args } = JSON.parse($el.dataset.vbarsHandler);
  let [listener, ...augs] = eventType.split(".");
  return { listener, augs, methodName, args };
}

export default function({ $root, methods, proxyData }) {
  function _findHandlers($container) {
    const $handlers = $container.querySelectorAll("[data-vbars-handler]");
    return $container.dataset.vbarsHandler ? $handlers.concat($container) : $handlers;
  }

  function _handler(event) {
    const $el = event.target;
    const { augs, methodName, args } = _parseHandler($el);

    if (augs.includes("prevent")) event.preventDefault();
    if (augs.includes("stop")) event.stopPropagation();

    const $refs = Array.from($root.querySelectorAll("[data-vbars-ref]")).reduce((obj, $el) => {
      obj[$el.dataset.vbarsRef] = $el;
      return obj;
    }, {});

    methods[methodName]({ event, data: proxyData, $root, $refs }, ...args);
  }

  return {
    remove($container) {
      console.groupCollapsed("removing event handlers");
      console.log("container", $container);

      _findHandlers($container).forEach($el => {
        const { listener, methodName } = _parseHandler($el);
        console.log({ listener, methodName, $el });
        $el.removeEventListener(listener, _handler);
      });
      console.groupEnd();
    },

    add($container) {
      console.groupCollapsed("adding event handlers");
      console.log("container", $container);

      _findHandlers($container).forEach($el => {
        const { listener, augs, methodName, args } = _parseHandler($el);
        console.log({ listener, augs, methodName, args, $el });
        $el.addEventListener(listener, _handler);
      });
      // this needs fixed
      $container.querySelectorAll("[data-vbars-bind]").forEach($el => {
        $el.addEventListener("input", $event => {
          Utils.setKey(proxyData, $el.dataset.vbarsBind, $event.currentTarget.value);
        });
      });

      console.groupEnd();
    },
  };
}
