import ReBars from "../src/index.js";
import Handlebars from "handlebars";

const _query = ($container, selector) => {
  const $matches = $container.querySelectorAll(selector);
  return $matches.length > 1 ? $matches : $matches[0];
};

export default {
  async wait(ms = 0) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  },

  ref(t, ref, selector = null) {
    const $el = t.context.scope.$refs()[ref];

    if (!$el) return null;
    return selector ? _query($el, selector) : $el;
  },

  find(t, selector) {
    return _query(t.context.$el, selector);
  },

  trigger(t, val, eventType = "click", search = "ref") {
    const $el = search === "query" ? this.find(t, val) : this.ref(t, val);
    $el.dispatchEvent(new MouseEvent(eventType, { bubbles: true }));
  },

  buildContext(t, app) {
    if (t.context.$el) t.context.$el.remove();
    const $el = document.createElement("div");
    document.body.append($el);

    t.context.$el = $el;
    t.context.app = ReBars.app({ ...app, $el, Handlebars, trace: false });

    const [id, inst] = Object.entries(t.context.app.components.instances)[0];
    t.context.id = id;
    t.context.inst = inst;
    t.context.scope = inst.scope;

    return this.wait();
  },
};
