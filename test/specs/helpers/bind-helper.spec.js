import test from "ava";
import Helpers from "../../helpers.js";

test.beforeEach(async t => {
  await Helpers.buildFixture(t, "helpers");
});

test.afterEach.always(Helpers.cleanup);

test("bind the event to the prop", async t => {
  await Helpers.trigger(t, "bindBtn1");
  t.is(Helpers.ref(t, "nameTarget").innerHTML, "Rick Morrow");
});

test("can force the value", async t => {
  await Helpers.trigger(t, "bindBtn2");
  t.is(Helpers.ref(t, "nameTarget").innerHTML, "Dave Clark");
});

test("sets null if no value", async t => {
  await Helpers.trigger(t, "bindBtn3");
  t.is(t.context.scope.rootData.name.last, null);
});

test("sets the value from an input", async t => {
  const $input = t.context.scope.$refs().bindInput;
  $input.value = "Eric";

  await Helpers.trigger(t, "bindInput", "input");
  t.is(t.context.scope.rootData.name.first, "Eric");
});
