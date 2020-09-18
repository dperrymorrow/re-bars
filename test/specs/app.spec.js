import test from "ava";
import ReBars from "../../src/index.js";
import Handlebars from "handlebars";
import Sinon from "sinon";
import Helpers from "../helpers.js";
import ProxyTrap from "../../src/proxy-trap.js";

test.beforeEach(async t => {
  window.Handlebars = Handlebars;

  await Helpers.buildContext(t, {
    template: "<h1>Hello there...</h1>",
    data: { name: "David" },
    methods: { foo: Sinon.stub() },
  });
});

test.afterEach.always(Helpers.cleanup);

test("ReBars exports properly", t => {
  t.is(typeof ReBars.app, "function");
  t.is(typeof ReBars.load, "function");
  t.is(typeof window.ReBars, "object");
});

test("returns object from app", t => {
  t.is(typeof t.context.app.render, "function");
  t.is(typeof t.context.app.store, "object");
  t.is(typeof t.context.app.store.renders, "object");
  t.is(typeof t.context.app.store.handlers, "object");
  t.is(typeof t.context.app.instance, "object");
});

test("renders to the element", t => {
  t.is(t.context.scope.$app.innerHTML, "<h1>Hello there...</h1>");
});

test("builds the scope", t => {
  const { $app, rootData, methods, $refs, $nextTick } = t.context.scope;

  t.is(typeof $nextTick, "function");
  t.is(typeof $refs, "function");
  t.is(typeof methods, "object");
  t.is(typeof rootData, "object");

  t.is($app.nodeType, Node.ELEMENT_NODE);
  t.is(rootData.name, "David");
  t.is(typeof methods.foo, "function");
});

// serial tests
test.serial("functions are bound", async t => {
  function foo(context) {
    t.is(this.name, "David");
    t.is(typeof context.methods, "object");
  }

  await Helpers.buildContext(t, {
    template: "<h1>Hello there...</h1>",
    data: { name: "David" },
    methods: { foo },
  });

  t.context.scope.methods.foo();
});

test.serial("throws if cant find Handlebars", t => {
  delete window.Handlebars;

  const err = t.throws(() => {
    ReBars.app({ trace: false, template: "" });
  });

  t.is(err.message.includes("needs Handlebars"), true);
});

test.serial("creates proxy out of data", async t => {
  Sinon.stub(ProxyTrap, "create");

  await Helpers.buildContext(t, {
    template: "<h1>hi</h1>",
    data: { name: "David" },
  });

  t.is(ProxyTrap.create.called, true);
  t.deepEqual(Object.keys(ProxyTrap.create.lastCall.args[0]).sort(), ["$app", "data", "methods"]);
});

test.serial("throws if cant find target", async t => {
  const err = await t.throwsAsync(() => {
    return ReBars.app({ trace: false, template: "" }).render("nope");
  });

  t.is(err.message.includes("nope"), true);
  t.is(err.message.includes("could not be found"), true);
});

test.serial("can take a Handlebars param", async t => {
  delete window.handlebars;
  const Handlebars = { create: Sinon.stub().returns({ foo: true }) };
  const app = ReBars.app({ trace: false, template: "", Handlebars });

  t.is(Handlebars.create.called, true);
  t.is(app.instance.foo, true);
});
