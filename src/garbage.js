import Config from "./config.js";

export default {
  start($app, { renders, handlers }) {
    const observer = new MutationObserver(([record]) => {
      record.removedNodes.forEach($el => {
        if ($el.nodeType !== Node.TEXT_NODE) {
          const watchId = $el.getAttribute(Config.attrs.watch);
          const handlerId = $el.getAttribute(Config.attrs.method);
          if (watchId) delete renders[watchId];

          if (handlerId) {
            handlers[handlerId].forEach(item => {
              item.$el.removeEventListener(item.eventType, item.handler);
            });
            delete handlers[handlerId];
          }
        }
      });
    });

    observer.observe($app, { attributes: true, childList: true, subtree: true });

    return observer;
  },
};
