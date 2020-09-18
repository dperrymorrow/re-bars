import test from "ava";
import Helpers from "../../helpers.js";

test.beforeEach(async t => {
  await Helpers.buildFixture(t, "helpers");
});

test.afterEach.always(Helpers.cleanup);

test("switches conditional rendering", async t => {
  const { $refs, rootData, $nextTick } = t.context.scope;

  t.is($refs().onlyIfName.disabled, true);
  t.is($refs().onlyIfShow.disabled, false);

  rootData.show = true;
  await $nextTick();
  t.is($refs().onlyIfShow.disabled, true);

  rootData.name.first = null;
  await $nextTick();
  t.is($refs().onlyIfName.disabled, false);
});
