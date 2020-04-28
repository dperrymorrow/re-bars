import test from "ava";
import Helpers from "../../helpers.js";
import Utils from "../../../src/utils/index.js";

const Comp = {
  template: /*html*/ `
    <div>
      {{ debug . ref="fullDebug" }}
      {{ debug name ref="nameDebug" }}
      {{ debug name.first ref="nameFirst" }}
    </div>
  `,
  name: "test",
  data() {
    return { name: { first: "david" } };
  },
};

test.beforeEach(t => {
  Helpers.buildContext(t, { root: Comp });
});

test.afterEach.always(Helpers.cleanup);

test("debugs all", t => {
  const content = Helpers.ref(t, "fullDebug").innerHTML;
  t.is(content, Utils.stringify(t.context.scope));
});

test("debugs 'name'", t => {
  const content = Helpers.ref(t, "nameDebug").innerHTML;
  t.is(content, Utils.stringify(t.context.scope.name));
});

test("debugs 'name.first'", t => {
  const content = Helpers.ref(t, "nameFirst").innerHTML;
  t.is(content, Utils.stringify(t.context.scope.name.first));
});

test.serial("throws if path not found", t => {
  const root = { template: "{{ debug doesNotExist }}", name: "Bad" };
  const error = t.throws(() => Helpers.buildContext(t, { root }));

  t.true(error.message.includes("Bad:"));
  t.true(error.message.includes("{{ debug doesNotExist }}"));
});

test.serial("throws if path not found on nested obj", t => {
  const root = { template: "{{ debug name.last }}", name: "Bad" };
  const error = t.throws(() => Helpers.buildContext(t, { root }));
  t.true(error.message.includes("Bad:"));
  t.true(error.message.includes("{{ debug name.last }}"));
});
