import test from "ava";
import Helpers from "../helpers.js";

const DemoComponent = {
  template: /*html*/ `
    <div>
      {{#watch name }}
        <h1 ref="title">{{ name.first }}</h1>
      {{/watch}}
      <p ref="fullName">{{ fullName }}</p>
      <button ref="changeBtn" {{ method "changeName" "Freddy" "King" }}></button>
    </div>
  `,
  name: "test",
  data() {
    return {
      fullName() {
        return `${this.name.first}, ${this.name.last}`;
      },
      name: { first: "Luther", last: "Allison" },
    };
  },
  methods: {
    changeName(event, first, last) {
      this.name.first = first;
      this.name.last = last;
    },
  },
};

test.beforeEach(t => {
  Helpers.buildContext(t, { root: DemoComponent });
});

test.afterEach.always(t => {
  t.context.$el.remove();
});

test("renders data values", t => {
  t.is(Helpers.ref(t, "title").innerHTML, "Luther");
});

test("adds methods to scope", t => {
  t.is(typeof t.context.scope.$el, "function");
  t.is(typeof t.context.scope.$refs, "function");
  t.is(typeof t.context.scope.$methods.changeName, "function");
});

test("adds internals to scope", t => {
  t.is(typeof t.context.scope.$_componentId, "string");
  t.is(t.context.scope.$name, "test");
});

test("renders data methods", t => {
  t.is(Helpers.ref(t, "fullName").innerHTML, "Luther, Allison");
});

test("re-renders on change", async t => {
  t.is(Helpers.ref(t, "title").innerHTML, "Luther");
  t.context.scope.name.first = "fred";
  await Helpers.wait();
  t.is(Helpers.ref(t, "title").innerHTML, "fred");
});

test("event handlers work", async t => {
  Helpers.ref(t, "changeBtn").click();
  t.is(t.context.scope.fullName(), "Freddy, King");
  await Helpers.wait();
  t.is(Helpers.ref(t, "title").innerHTML, "Freddy");
});
