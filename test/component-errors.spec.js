import test from "ava";
import sinon from "sinon";
import ReBars from "../src/index.js";
import Component from "../src/component.js";
import Handlebars from "handlebars";
import Errors from "../src/errors.js";

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

  t.context.def = {
    template: "<h1></h1>",
    name: "test",
    data: () => ({}),
  };

  t.context.id = id;
});

test.afterEach.always(t => {
  t.context.$el.remove();
  sinon.restore();
});

test("makes you add a name", t => {
  delete t.context.def.name;
  const error = t.throws(() => Component.register(t.context.id, Handlebars, t.context.def));
  t.is(error.message, Errors.noName({}));
});

test("throws error if child components have no name", t => {
  t.context.def.components = [{ prop: "val" }];
  const error = t.throws(() => Component.register(t.context.id, Handlebars, t.context.def));
  t.is(error.message, Errors.noName(t.context.def));
});

test("throws error if no root node", t => {
  t.context.def.template = "";
  const error = t.throws(() =>
    Component.register(t.context.id, Handlebars, t.context.def)
      .instance()
      .render()
  );
  t.is(error.message, Errors.oneRoot(t.context.def));
});

test("throws error if more than one root node", t => {
  t.context.def.template = "<div></div><div></div>";
  const error = t.throws(() =>
    Component.register(t.context.id, Handlebars, t.context.def)
      .instance()
      .render()
  );
  t.is(error.message, Errors.oneRoot(t.context.def));
});

test("throws error if root node is a watch", t => {
  t.context.def.template = "{{#watch}}{{/watch}}";
  const error = t.throws(() =>
    Component.register(t.context.id, Handlebars, t.context.def)
      .instance()
      .render()
  );
  t.is(error.message, Errors.oneRoot(t.context.def));
});

test("ensures that data is a function", t => {
  t.context.def.data = {};
  const error = t.throws(() => Component.register(t.context.id, Handlebars, t.context.def).instance());
  t.is(error.message, Errors.dataFn(t.context.def));
});

test.serial("warns if you are overwriting a data prop", t => {
  sinon.stub(console, "warn");
  t.context.def.data = () => ({ key: "value" });
  Component.register(t.context.id, Handlebars, t.context.def).instance({ key: "newValue" });
  t.is(console.warn.lastCall.args[0], Errors.propStomp({ name: "test", key: "key" }));
});

test.serial("warns if you are pass undefined as a prop", t => {
  sinon.stub(console, "warn");
  Component.register(t.context.id, Handlebars, t.context.def).instance({ bad: undefined });
  t.is(console.warn.lastCall.args[0], Errors.propUndef({ name: "test", key: "bad" }));
});
