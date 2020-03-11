import test from "ava";
import ReBars from "../src/index.js";
import Handlebars from "handlebars";
import Errors from "../src/errors.js";
import Utils from "../src/utils.js";
import sinon from "sinon";

test.beforeEach(t => {
  window.Handlebars = Handlebars;
  t.context.$el = document.createElement("div");
  document.body.append(t.context.$el);

  t.context.app = {
    $el: t.context.$el,
    root: { name: "test", template: "<h1></h1>" },
  };
});

test.afterEach.always(t => {
  t.context.$el.remove();
});

test("ReBars is a function", t => {
  t.is(typeof ReBars, "function");
});

test("calls utils random id", t => {
  sinon.stub(Utils, "randomId").returns("rando");
  const { id } = ReBars(t.context.app);
  t.is(id, "rando");
  t.is(Utils.randomId.called, true);
});

test("defines vars on window", t => {
  ReBars(t.context.app);
  t.is(typeof window.ReBars, "object");
  t.is(typeof window.ReBars.handlers, "object");
  t.is(typeof window.ReBars.apps, "object");
  t.is(window.rbs, window.ReBars);
});

test.serial("throws if element not in document", t => {
  t.context.app.$el = document.createElement("div");
  const error = t.throws(() => ReBars(t.context.app));
  t.is(error.message, Errors.noEl());
});

test.serial("can create an app", t => {
  t.context.app.root.template = "<h1>hello world</h1>";
  ReBars(t.context.app);
  t.is(document.querySelector("h1").innerHTML, "hello world");
});

test("returns storage", t => {
  const { storage, id } = ReBars(t.context.app);
  t.is(typeof storage.inst, "object");
  t.is(typeof storage.cDefs, "object");
  t.is(typeof id, "string");
});

test("adds handlers", t => {
  ReBars(t.context.app);
  t.is(typeof window.rbs.handlers.bound, "function");
  t.is(typeof window.rbs.handlers.trigger, "function");
});

test("storage is stored on window", t => {
  const { storage, id } = ReBars(t.context.app);
  t.is(storage, window.rbs.apps[id]);
});

test.serial("needs Handlebars in order to run", t => {
  delete window.Handlebars;
  const error = t.throws(() => ReBars(t.context.app));
  t.is(error.message, Errors.noHbs());
});
