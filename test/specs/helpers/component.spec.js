import test from "ava";
import Helpers from "../../helpers.js";

test.afterEach.always(Helpers.cleanup);

test("throws if not registered", t => {
  const { message } = t.throws(() => {
    Helpers.buildContext(t, {
      root: {
        template: "<div>{{ component 'nope' }}</div>",
        name: "test",
      },
    });
  });

  t.true(message.includes("test:"));
  t.true(message.includes("{{ component 'nope' }}"));
});

test("ensures there is only one root element", t => {
  const root = {
    template: "<div></div><div></div>",
    name: "test",
  };

  const { message } = t.throws(() => {
    Helpers.buildContext(t, { root });
  });

  t.true(message.includes("test:"));
  t.true(message.includes("multiple root"));
  t.true(message.includes(root.template));
});

test("cannot have <p> as root", t => {
  const root = {
    template: "<p></p>",
    name: "test",
  };

  const { message } = t.throws(() => {
    Helpers.buildContext(t, { root });
  });

  t.true(message.includes("test:"));
  t.true(message.includes("<p> cannot be"));
  t.true(message.includes(root.template));
});

test("cannot have watch as root", t => {
  const root = {
    template: "{{#watch name }}{{/watch}}",
    name: "test",
    data: () => ({ name: "d" }),
  };

  const { message } = t.throws(() => {
    Helpers.buildContext(t, { root });
  });

  t.true(message.includes("test:"));
  t.true(message.includes("watch"));
  t.true(message.includes(root.template));
});

test("can render global components", async t => {
  await Helpers.buildContext(t, {
    root: {
      template: "<div>{{ component 'child' }}</div>",
      name: "test",
    },
    components: [{ name: "child", template: "<div>Hello Child!</div>" }],
  });

  t.is(t.context.$el.innerHTML.includes("Hello Child!"), true);
});

test("can render local components", async t => {
  await Helpers.buildContext(t, {
    root: {
      template: "<div>{{ component 'child' }}</div>",
      name: "test",
      components: [{ name: "child", template: "<div>Hello Child!</div>" }],
    },
  });

  t.is(t.context.$el.innerHTML.includes("Hello Child!"), true);
});

test("passes props to the child", async t => {
  await Helpers.buildContext(t, {
    root: {
      template: "<div>{{ component 'child' name='David' hobby='Bonsai' }}</div>",
      name: "test",
      components: [{ name: "child", template: "<div></div>" }],
    },
  });
  const { scope } = Helpers.getCompByName(t, "child");
  t.is(scope.$props.name, "David");
  t.is(scope.$props.hobby, "Bonsai");
});

test("can pass data as props", async t => {
  await Helpers.buildContext(t, {
    root: {
      template: "<div>{{ component 'child' name=name }}</div>",
      name: "test",
      data: () => ({ name: "David" }),
      components: [{ name: "child", template: "<div></div>" }],
    },
  });
  const { scope } = Helpers.getCompByName(t, "child");
  t.is(scope.$props.name, "David");
});

test("can pass objects as props", async t => {
  await Helpers.buildContext(t, {
    root: {
      template: "<div>{{ component 'child' name=name }}</div>",
      name: "test",
      data: () => ({ name: { first: "David" } }),
      components: [{ name: "child", template: "<div></div>" }],
    },
  });
  const { scope } = Helpers.getCompByName(t, "child");
  t.is(scope.$props.name.first, "David");
});

test("can pass methods as props", async t => {
  let methodScope;
  await Helpers.buildContext(t, {
    root: {
      template: "<div>{{ component 'child' changeName=$methods.changeName }}</div>",
      name: "test",
      data: () => ({ name: "David" }),
      methods: {
        changeName() {
          methodScope = this;
        },
      },
      components: [{ name: "child", template: "<div></div>" }],
    },
  });
  const { scope } = Helpers.getCompByName(t, "child");
  scope.$props.changeName();
  t.is(typeof scope.$props.changeName, "function");
  t.is(methodScope.name, "David");
});
