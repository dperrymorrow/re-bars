import test from "ava";
import Helpers from "../../helpers.js";

test.beforeEach(async t => {
  await Helpers.buildFixture(t, "helpers");
});

test.afterEach.always(Helpers.cleanup);

test("on triggers the methods", async t => {
  await Helpers.trigger(t, "onBtn1");
  t.is(Helpers.ref(t, "nameTarget").innerHTML, "Rick James");
});

test("on can trigger multiple events", async t => {
  await Helpers.trigger(t, "onBtn2", "mouseover");
  t.is(Helpers.ref(t, "nameTarget").innerHTML, "Gary Clark");
  await Helpers.trigger(t, "onBtn2", "mouseout");
  t.is(Helpers.ref(t, "nameTarget").innerHTML, "Dave Morrow");
});
