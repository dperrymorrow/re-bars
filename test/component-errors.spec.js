import test from "ava";
import sinon from "sinon";
import ReBars from "../src/index.js";
import Component from "../src/component.js";
import Handlebars from "handlebars";
import Msg from "../src/Msg.js";

test.beforeEach(t => {
  window.Handlebars = Handlebars;
  t.context.$el = document.createElement("div");
  document.body.append(t.context.$el);

  const { id } = ReBars.app({
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
  t.is(error.message, Msg.messages.noName({}));
});

test("throws error if child components have no name", t => {
  t.context.def.components = [{ prop: "val" }];
  const error = t.throws(() => Component.register(t.context.id, Handlebars, t.context.def));
  t.is(error.message, Msg.messages.noName(t.context.def));
});

test("throws error if no root node", t => {
  t.context.def.template = "";
  const error = t.throws(() =>
    Component.register(t.context.id, Handlebars, t.context.def)
      .instance()
      .render()
  );
  t.is(error.message, Msg.messages.oneRoot(t.context.def));
});

test("throws error if more than one root node", t => {
  t.context.def.template = "<div></div><div></div>";
  const error = t.throws(() =>
    Component.register(t.context.id, Handlebars, t.context.def)
      .instance()
      .render()
  );
  t.is(error.message, Msg.messages.oneRoot(t.context.def));
});

test("throws error if root node is a watch", t => {
  t.context.def.template = "{{#watch}}{{/watch}}";
  const error = t.throws(() =>
    Component.register(t.context.id, Handlebars, t.context.def)
      .instance()
      .render()
  );
  t.is(error.message, Msg.messages.oneRoot(t.context.def));
});

test("ensures that data is a function", t => {
  t.context.def.data = {};
  const error = t.throws(() => Component.register(t.context.id, Handlebars, t.context.def).instance());
  t.is(error.message, Msg.messages.dataFn(t.context.def));
});

test.serial("warns if you are pass undefined as a prop", t => {
  sinon.stub(Msg, "warn");
  Component.register(t.context.id, Handlebars, t.context.def).instance({ bad: undefined });
  const args = Msg.warn.lastCall.args;
  t.is(args[0], "propUndef");
  t.deepEqual(args[1], { name: "test", key: "bad" });
});
