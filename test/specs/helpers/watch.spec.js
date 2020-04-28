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

test("does not throw if passed a string", async t => {
  Helpers.buildContext(t, {
    root: {
      name: "test",
      template: "<div>{{#watch 'some.*.crazy.*.path' }}{{/watch}}</div>",
    },
  });

  const { path } = Object.values(t.context.inst.renders)[0];
  t.deepEqual(path, ["some.*.crazy.*.path"]);
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

test("can watch multiple items", async t => {
  Helpers.buildContext(t, {
    root: {
      name: "test",
      template: "<div>{{#watch 'name,hobby' }}{{/watch}}</div>",
      data: () => ({ name: "Dave", hobby: "bonsai" }),
    },
  });

  const { path } = Object.values(t.context.inst.renders)[0];
  t.deepEqual(path, ["name", "hobby"]);
});

test("uses wildcard if an Object", async t => {
  Helpers.buildContext(t, {
    root: {
      name: "test",
      template: "<div>{{#watch name }}{{/watch}}</div>",
      data: () => ({ name: { first: "Dave", last: "Morrow" } }),
    },
  });

  const { path } = Object.values(t.context.inst.renders)[0];
  t.deepEqual(path, ["name.*"]);
});

test("uses wildcard on Index of Array", async t => {
  Helpers.buildContext(t, {
    root: {
      name: "test",
      template: "<div>{{#watch 'friends.*.name' }}{{/watch}}</div>",
      data: () => ({ friends: ["Mike", "Jason"] }),
    },
  });

  const { path } = Object.values(t.context.inst.renders)[0];
  t.deepEqual(path, ["friends.*.name"]);
});
