import test from "ava";
import Helpers from "../../helpers.js";

test.beforeEach(async t => {
  await Helpers.buildFixture(t, "helpers");
});

test.afterEach.always(Helpers.cleanup);

test("$refs method returns all refs", t => {
  const $refs = t.context.scope.$refs();

  t.is(typeof $refs, "object");

  t.is("Dave" in $refs, true);
  t.is("static" in $refs, true);

  t.is($refs.Dave.innerHTML, "Dynamic");
  t.is($refs.static.innerHTML, "Static");
});
