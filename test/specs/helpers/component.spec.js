import test from "ava";
import Sinon from "sinon";
import Helpers from "../../helpers.js";
import Msg from "../../../src/msg.js";

test.afterEach.always(t => {
  t.context.$el.remove();
  Sinon.restore();
});

test("false if not registered", t => {
  Sinon.stub(Msg.messages, "noComp").returns("Kaboom");

  const { message } = t.throws(() => {
    Helpers.buildContext(t, {
      root: {
        template: "<div>{{ component 'nope' }}</div>",
        name: "test",
      },
    });
  });

  t.is(message, "Kaboom");
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
