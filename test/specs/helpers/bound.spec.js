import test from "ava";
import Helpers from "../../helpers.js";

test.afterEach.always(Helpers.cleanup);

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
  const { message } = t.throws(() => {
    Helpers.buildContext(t, {
      root: {
        name: "test",
        template: "<div><input {{ bound name }}></div>",
        data: () => ({ name: { first: "dave" } }),
      },
    });
  });

  t.true(message.includes("bound"));
  t.true(message.includes("test:"));
  t.true(message.includes("{{ bound name }}"));
});

test.serial("throws if path is not found", async t => {
  const { message } = t.throws(() => {
    Helpers.buildContext(t, {
      root: {
        name: "test",
        template: "<div><input {{ bound 'no.exist' }}></div>",
      },
    });
  });

  t.true(message.includes("test:"));
  t.true(message.includes("{{ bound 'no.exist' }}"));
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

test("can take ref as an arg", async t => {
  await Helpers.buildContext(t, {
    root: {
      name: "test",
      template: "<div><input {{ bound 'name' ref='customRef' }}></div>",
      data: () => ({ name: "david" }),
    },
  });

  t.is(Helpers.ref(t, "customRef").value, "david");
});
