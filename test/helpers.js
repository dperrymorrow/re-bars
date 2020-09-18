import ReBars from "../src/index.js";
import Handlebars from "handlebars";
import Sinon from "sinon";
import fs from "fs";
import path from "path";

const fixtureDir = path.join(__dirname, "fixtures");

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

  async trigger(t, val, eventType = "click", search = "ref") {
    const $el = search === "query" ? this.find(t, val) : this.ref(t, val);
    $el.dispatchEvent(new MouseEvent(eventType, { bubbles: true }));
    await t.context.scope.$nextTick();
    return $el;
  },

  cleanup(t) {
    if (t.context.$el) t.context.$el.remove();
    Sinon.restore();
  },

  buildFixture(t, name) {
    const app = require(`${fixtureDir}/${name}.js`).default;
    app.template = fs.readFileSync(`${fixtureDir}/${name}.hbs`, "utf-8");
    return this.buildContext(t, app);
  },

  async buildContext(t, app) {
    window.Handlebars = Handlebars;
    if (t.context.$el) t.context.$el.remove();
    const $el = document.createElement("div");
    document.body.append($el);

    t.context.$el = $el;
    t.context.app = ReBars.app({ Handlebars, trace: false, ...app });
    t.context.scope = await t.context.app.render($el);
    await t.context.scope.$nextTick();
  },
};
