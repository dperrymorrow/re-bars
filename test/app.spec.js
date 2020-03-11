import test from "ava";
import ReBars from "../src/index.js";
import Handlebars from "handlebars";
import Errors from "../src/errors.js";
import Utils from "../src/utils.js";
import Component from "../src/component.js";
import sinon from "sinon";

test.beforeEach(t => {
  window.Handlebars = Handlebars;
  t.context.$el = document.createElement("div");
  t.context.root = {};
  document.body.append(t.context.$el);

  t.context.app = {
    $el: t.context.$el,
    root: t.context.root,
  };

  t.context.renderStub = sinon.stub();
  t.context.instanceStub = sinon.stub().returns({ render: t.context.renderStub });

  sinon.stub(Component, "register").returns({
    instance: t.context.instanceStub,
  });
});

test.afterEach.always(t => {
  t.context.$el.remove();
  sinon.restore();
});

test.serial("ReBars is a function", t => {
  t.is(typeof ReBars, "function");
});

test.serial("calls utils random id", t => {
  sinon.stub(Utils, "randomId").returns("rando");
  const { id } = ReBars(t.context.app);
  t.is(id, "rando");
  t.is(Utils.randomId.called, true);
});

test.serial("defines vars on window", t => {
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
  ReBars(t.context.app);
  t.is(Component.register.lastCall.args[2], t.context.root);
  t.is(t.context.instanceStub.called, true);
  t.is(t.context.renderStub.called, true);
});

test.serial("returns storage", t => {
  const { storage, id } = ReBars(t.context.app);
  t.is(typeof storage.inst, "object");
  t.is(typeof storage.cDefs, "object");
  t.is(typeof id, "string");
});

test.serial("adds handlers", t => {
  ReBars(t.context.app);
  t.is(typeof window.rbs.handlers.bound, "function");
  t.is(typeof window.rbs.handlers.trigger, "function");
});

test.serial("storage is stored on window", t => {
  const { storage, id } = ReBars(t.context.app);
  t.is(storage, window.rbs.apps[id]);
});

test.serial("needs Handlebars in order to run", t => {
  delete window.Handlebars;
  const error = t.throws(() => ReBars(t.context.app));
  t.is(error.message, Errors.noHbs());
});
