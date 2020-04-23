import test from "ava";
import Sinon from "sinon";
import Helpers from "../../helpers.js";

test.afterEach.always(t => {
  t.context.$el.remove();
  Sinon.restore();
});

test("isComponent false if not registered", async t => {
  await Helpers.buildContext(t, {
    root: {
      template: "<div>{{ isComponent 'nope' }}</div>",
      name: "test",
    },
  });

  t.is(t.context.scope.$el().innerHTML, "false");
});

test("isComponent true if registered", async t => {
  await Helpers.buildContext(t, {
    root: {
      template: "<div>{{ isComponent 'child' }}</div>",
      components: [{ name: "child", template: "<div/>" }],
      name: "test",
    },
  });

  t.is(t.context.scope.$el().innerHTML, "true");
});

test("works on global components", async t => {
  await Helpers.buildContext(t, {
    components: [{ name: "child", template: "<div/>" }],
    root: {
      template: "<div>{{ isComponent 'child' }}</div>",
      name: "test",
    },
  });

  t.is(t.context.scope.$el().innerHTML, "true");
});
