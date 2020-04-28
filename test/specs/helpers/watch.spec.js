import test from "ava";
import Helpers from "../../helpers.js";

test.afterEach.always(t => {
  if (t.context.$el) t.context.$el.remove();
});

test("throws if value undefined", async t => {
  const root = {
    name: "test",
    template: "<div>{{#watch name }}{{/watch}}</div>",
  };

  const { message } = t.throws(() => {
    Helpers.buildContext(t, { root });
  });

  t.true(message.includes("test:"));
  t.true(message.includes(root.template));
});

test("builds the dom $el", async t => {
  Helpers.buildContext(t, {
    root: {
      name: "test",
      template: "<div>{{#watch 'name' ref='watcher' }}{{/watch}}</div>",
      data: () => ({ name: "Dave" }),
    },
  });

  const $watch = Helpers.ref(t, "watcher");

  t.is($watch.nodeName, "SPAN");
  t.is($watch.getAttribute("style"), "display:none;");
  t.true($watch.dataset.rbsWatch.startsWith("rbs"));
});

test("takes a tag, and or optional attrs ", async t => {
  Helpers.buildContext(t, {
    root: {
      name: "test",
      template: "<div>{{#watch 'name' tag='div'ref='watcher' foo='bar' }}{{/watch}}</div>",
      data: () => ({ name: "Dave" }),
    },
  });

  const $watch = Helpers.ref(t, "watcher");

  t.is($watch.nodeName, "DIV");
  t.is($watch.getAttribute("foo"), "bar");
});
