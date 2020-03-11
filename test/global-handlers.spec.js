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
  document.body.append(t.context.$el);

  sinon.stub(Component, "register").returns({
    instance() {
      return { render() {} };
    },
  });
  ReBars({
    $el: t.context.$el,
    root: {},
  });
  t.context.scope = { name: "test", methods: {}, data: {} };
  sinon.stub(Utils, "getStorage").returns({ scope: t.context.scope });
});

test.afterEach.always(t => {
  t.context.$el.remove();
  sinon.restore();
});

test.serial("trigger: calls the storage to get the scope", t => {
  const methodStub = sinon.stub();
  t.context.scope.methods = { myMethod: methodStub };
  window.rbs.handlers.trigger("appId", "cId", "myMethod", "optionalParam");
  const storageArgs = Utils.getStorage.lastCall.args;

  t.is(storageArgs[0], "appId");
  t.is(methodStub.called, true);
  t.is(methodStub.lastCall.args[0], "optionalParam");
  t.is(storageArgs[1], "cId");
});

test.serial("trigger: throws if the method is not found", t => {
  t.context.scope.methods = {};
  const error = t.throws(() => window.rbs.handlers.trigger("appId", "cId", "missing"));
  t.is(error.message, Errors.noMethod({ name: "test", methodName: "missing" }));
});

test.serial("bound: will update the path if found", t => {
  t.context.scope.data = { name: { first: "david" } };
  const event = { target: { value: "Fred" } };

  window.rbs.handlers.bound("appId", "cId", event, "name.first");
  t.is(t.context.scope.data.name.first, "Fred");
});

test.serial("bound: throws error if path is not found", t => {
  t.context.scope.data = {};
  const event = { target: { value: "Fred" } };
  const error = t.throws(() => window.rbs.handlers.bound("appId", "cId", event, "name.first"));
  t.is(error.message, Errors.badPath({ path: "name.first" }));
});
