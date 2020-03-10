import test from "ava";
import sinon from "sinon";
import ReBars from "../src/index.js";
import Component from "../src/component.js";
import Handlebars from "handlebars";

test.beforeEach(t => {
  window.Handlebars = Handlebars;
  t.context.$el = document.createElement("div");
  document.body.append(t.context.$el);

  const { id } = ReBars({
    $el: t.context.$el,
    root: {
      name: "tester",
      template: "<h1>{{ name }}</h1>",
    },
  });

  t.context.id = id;
});

test.afterEach.always(t => {
  t.context.$el.remove();
  sinon.restore();
});

test("makes you add a name", t => {
  const error = t.throws(() => Component.create(t.context.id, Handlebars, {}));
  t.is(error.message, "Each ReBars component should have a name");
});

test("throws error if child components have no name", t => {
  const def = { template: "<h1><h1>", name: "test", components: [{}] };
  const error = t.throws(() => Component.create(t.context.id, Handlebars, def));
  t.is(error.message, "component:test child component needs a name");
});

test("throws error if no root node", t => {
  const def = { template: "", name: "test" };
  const error = t.throws(() => Component.create(t.context.id, Handlebars, def).render());
  t.is(error.message, "component:test must have one root node, and cannot be a {{#watch}}");
});

test("throws error if more than one root node", t => {
  const def = { template: "<div></div><div></div>", name: "test" };
  const error = t.throws(() => Component.create(t.context.id, Handlebars, def).render());
  t.is(error.message, "component:test must have one root node, and cannot be a {{#watch}}");
});

test("throws error if root node is a watch", t => {
  const def = { template: "{{#watch}}{{/watch}}", name: "test" };
  const error = t.throws(() => Component.create(t.context.id, Handlebars, def).render());
  t.is(error.message, "component:test must have one root node, and cannot be a {{#watch}}");
});

test("ensures that data is a function", t => {
  const def = { template: "<div></div>", name: "test", data: {} };
  const error = t.throws(() => Component.create(t.context.id, Handlebars, def).render());
  t.is(error.message, "component:test data must be a function");
});

test.serial("warns if you are overwriting a data prop", t => {
  sinon.stub(console, "warn");
  const def = { template: "<div></div>", name: "test", data: () => ({ key: "value" }) };
  Component.create(t.context.id, Handlebars, def).render({ key: "newValue" });
  t.is(console.warn.lastCall.args[0], "component:test prop key was overrode with value from data");
});
