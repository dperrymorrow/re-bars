import test from "ava";
import ReBars from "../../src/index.js";
import Handlebars from "handlebars";
import DemoComponent from "./component.js";
import Utils from "../../src/utils/index.js";
import Helpers from "../helpers.js";

const _getInst = ({ storage }) => Object.entries(storage.inst)[0];

test.beforeEach(t => {
  window.Handlebars = Handlebars;
  t.context.$el = document.createElement("div");
  document.body.append(t.context.$el);

  t.context.app = {
    $el: t.context.$el,
    root: DemoComponent,
  };
});

test.afterEach.always(t => {
  t.context.$el.remove();
});

test("renders data values", t => {
  ReBars.app(t.context.app);
  t.is(document.querySelector("h1").innerHTML, "David");
});

test("renders data methods", t => {
  ReBars.app(t.context.app);
  t.is(document.querySelector("p").innerHTML, "David, Morrow");
});

test("re-renders on change", async t => {
  const [id, inst] = _getInst(ReBars.app(t.context.app));
  const $el = Utils.dom.findComponent(id);

  t.is(typeof $el, "object");
  t.is($el.querySelector("p").innerHTML, "David, Morrow");
  inst.scope.name.first = "fred";
  await Helpers.wait(0);
  t.is($el.querySelector("h1").innerHTML, "fred");
});

test("event handlers work", async t => {
  const [id, inst] = _getInst(ReBars.app(t.context.app));
  const $el = Utils.dom.findComponent(id);

  inst.scope.$methods.changeName(null, "mike");
  t.is(inst.scope.name.first, "mike");

  await Helpers.wait(0);
  t.is($el.querySelector("h1").innerHTML, "mike");
});
