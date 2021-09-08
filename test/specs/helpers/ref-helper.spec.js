import test from "ava";
import Helpers from "../../helpers.js";
import SeeDom from "see-dom";

const DomView = SeeDom({ css: "/docs/dist/docs.min.css" });

test.beforeEach(async t => {
  await Helpers.buildFixture(t, "helpers");
});

test.afterEach.always(Helpers.cleanup);

test("$refs method returns all refs", t => {
  const $refs = t.context.scope.$refs();

  DomView.view("$refs test");

  t.is(typeof $refs, "object");

  t.is("Dave" in $refs, true);
  t.is("static" in $refs, true);

  t.is($refs.Dave.innerHTML, "Dynamic");
  t.is($refs.static.innerHTML, "Static");
});
