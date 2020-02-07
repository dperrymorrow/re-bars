import Utils from "./utils.js";

function _parseHandler($el) {
  const { eventType, methodName, args } = JSON.parse($el.dataset.vbarsHandler);
  let [listener, ...augs] = eventType.split(".");
  return { listener, augs, methodName, args };
}

export default function({ $root, methods, proxyData }) {
  function _findHandlers($container, type) {
    const $handlers = $container.querySelectorAll(`[data-vbars-${type.toLowerCase()}]`);
    return $container.dataset[type] ? $handlers.concat($container) : $handlers;
  }

  const _bind = $event =>
    Utils.setKey(proxyData, event.target.dataset.vbarsBind, $event.currentTarget.value);

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

      _findHandlers($container, "Handler").forEach($el => {
        const { listener, methodName } = _parseHandler($el);
        console.log({ listener, methodName, $el });
        $el.removeEventListener(listener, _handler);
      });

      _findHandlers($container, "Bind").forEach($el => {
        console.log({ type: "input", $el });
        $el.removeEventListener("input", _bind);
      });
      console.groupEnd();
    },

    add($container) {
      console.groupCollapsed("adding event handlers");
      console.log("container", $container);

      _findHandlers($container, "Handler").forEach($el => {
        const { listener, augs, methodName, args } = _parseHandler($el);
        console.log({ listener, augs, methodName, args, $el });
        $el.addEventListener(listener, _handler);
      });

      _findHandlers($container, "Bind").forEach($el => {
        $el.addEventListener("input", _bind);
        console.log({ type: "input", $el });
      });

      console.groupEnd();
    },
  };
}
