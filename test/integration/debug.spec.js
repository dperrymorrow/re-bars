import test from "ava";
import Helpers from "../helpers.js";

const DemoComponent = {
  template: /*html*/ `
    <div>
      {{ debug . ref="fullDebug" }}
      {{ debug name ref="nameDebug" }}
      {{ debug name.first ref="nameFirst" }}
    </div>
  `,
  name: "test",
  data() {
    return {
      name: { first: "david" },
      hobby: "bonsai",
    };
  },
};

test.beforeEach(t => {
  Helpers.buildContext(t, DemoComponent);
});

test.afterEach.always(t => {
  t.context.$el.remove();
});

test("debugs all", t => {
  const content = Helpers.ref(t, "fullDebug").innerHTML;
  const parser = (key, val) => (typeof val === "function" ? val + "" : val);
  t.is(content, JSON.stringify(t.context.scope, parser, 2));
});

test("debugs 'name'", t => {
  const content = Helpers.ref(t, "nameDebug").innerHTML;
  t.is(content, JSON.stringify(t.context.scope.name, null, 2));
});

test("debugs 'name.first'", t => {
  const content = Helpers.ref(t, "nameFirst").innerHTML;
  t.is(content, JSON.stringify(t.context.scope.name.first, null, 2));
});
