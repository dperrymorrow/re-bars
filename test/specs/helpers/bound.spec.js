import test from "ava";
import Helpers from "../../helpers.js";
import Sinon from "sinon";
import Msg from "../../../src/msg.js";

test.afterEach.always(t => {
  if (t.context.$el) t.context.$el.remove();
  Sinon.restore();
});

test("binds the input", async t => {
  await Helpers.buildContext(t, {
    root: {
      name: "test",
      template: "<div><input {{ bound 'name' }}></div>",
      data: () => ({ name: "dave" }),
    },
  });

  const $input = Helpers.find(t, "input");
  t.is($input.value, "dave");
  t.is($input.getAttribute("ref"), "name");
});

test.serial("throws if pass object", async t => {
  Sinon.stub(Msg.messages, "badPath").returns("kaboom");
  const { message } = t.throws(() => {
    Helpers.buildContext(t, {
      root: {
        name: "test",
        template: "<div><input {{ bound name }}></div>",
        data: () => ({ name: { first: "dave" } }),
      },
    });
  });

  t.is(message, "kaboom");
});

test.serial("throws if path is not found", async t => {
  Sinon.stub(Msg.messages, "badPath").returns("kaboom");
  const { message } = t.throws(() => {
    Helpers.buildContext(t, {
      root: {
        name: "test",
        template: "<div><input {{ bound 'no.exist' }}></div>",
      },
    });
  });

  t.is(message, "kaboom");
});

test("updates the bound value on change", async t => {
  await Helpers.buildContext(t, {
    root: {
      name: "test",
      template: "<div><input {{ bound 'name' }}></div>",
      data: () => ({ name: "david" }),
    },
  });

  Helpers.ref(t, "name").value = "Mike";
  Helpers.trigger(t, "name", "input");
  await Helpers.wait();
  t.is(t.context.scope.name, "Mike");
});
