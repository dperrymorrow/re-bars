import test from "ava";
import Helpers from "../../helpers.js";

test.afterEach.always(t => {
  Helpers.cleanup(t);
});

test("throws if value undefined", t => {
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

test.only("throws any arg undefined", t => {
  const { message } = t.throws(() => {
    Helpers.buildContext(t, {
      root: {
        name: "test",
        data: () => ({ name: "dave" }),
        template: "<div>{{#watch 'name' fred }}{{/watch}}</div>",
      },
    });
  });

  t.true(message.includes("test:"));
  t.true(message.includes("{{#watch 'name'"));
});

test("does not throw if passed a string", t => {
  Helpers.buildContext(t, {
    root: {
      name: "test",
      template: "<div>{{#watch 'some.*.crazy.*.path' }}{{/watch}}</div>",
    },
  });

  const { path } = Object.values(t.context.inst.renders)[0];
  t.deepEqual(path, ["some.*.crazy.*.path"]);
});

test("builds the dom $el", t => {
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

test("takes a tag, and or optional attrs ", t => {
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

test("can watch multiple items", t => {
  Helpers.buildContext(t, {
    root: {
      name: "test",
      template: "<div>{{#watch 'name' 'hobby' }}{{/watch}}</div>",
      data: () => ({ name: "Dave", hobby: "bonsai" }),
    },
  });

  const { path } = Object.values(t.context.inst.renders)[0];
  t.deepEqual(path, ["name", "hobby"]);
});

test("adds the id to renders", t => {
  Helpers.buildContext(t, {
    root: {
      name: "test",
      template: "<div>{{#watch 'name' 'hobby' ref='watch' }}{{/watch}}</div>",
      data: () => ({ name: "Dave", hobby: "bonsai" }),
    },
  });
  const id = t.context.$refs.watch.dataset.rbsWatch;
  const { path, render } = Object.values(t.context.inst.renders)[id];
  t.is(typeof render, "function");
  t.deepEqual(path, ["name", "hobby"]);
});

test("uses wildcard if an Object", t => {
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

test("uses wildcard on Index of Array", t => {
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

test("throws if watch $prop", t => {
  const { message } = t.throws(() => {
    Helpers.buildContext(t, {
      trace: true,
      root: {
        name: "test",
        template: "<div>{{ component 'child' name='dave' }}</div>",
        components: [{ name: "child", template: "<div>{{#watch $props }}{{/watch}}</div>" }],
      },
    });
  });

  t.true(message.toLowerCase().includes("do not watch $props"));
  t.true(message.includes("{{#watch $props }}"));
});

test("throws if watch $props even if arg is String", t => {
  const { message } = t.throws(() => {
    Helpers.buildContext(t, {
      trace: true,
      root: {
        name: "test",
        template: "<div>{{ component 'child' name='dave' }}</div>",
        components: [{ name: "child", template: "<div>{{#watch '$props.name' }}{{/watch}}</div>" }],
      },
    });
  });

  t.true(message.toLowerCase().includes("do not watch $props"));
  t.true(message.includes("{{#watch '$props.name' }}"));
});
