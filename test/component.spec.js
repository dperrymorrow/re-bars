import test from "ava";
import sinon from "sinon";
import ReBars from "../src/index.js";
import Handlebars from "handlebars";

test.beforeEach(t => {
  window.Handlebars = Handlebars;
  t.context.$el = document.createElement("div");
  document.body.append(t.context.$el);

  t.context.component = {
    name: "tester",
    template: /*html*/ `
      <h1>{{ name }}</h1>
    `,
    data() {
      return {
        name: "David",
      };
    },
  };
});

test.afterEach.always(t => {
  t.context.$el.remove();
  sinon.restore();
});

test("will render the component", t => {
  ReBars({
    $el: t.context.$el,
    root: t.context.component,
  });

  t.is(document.querySelector("h1").innerHTML, "David");
});

test("makes you add a name", t => {
  delete t.context.component.name;

  const error = t.throws(() =>
    ReBars({
      $el: t.context.$el,
      root: t.context.component,
    })
  );

  t.is(error.message, "Each ReBars component should have a name");
});

test("ensures that data is a function", t => {
  t.context.component.data = {};

  const error = t.throws(() =>
    ReBars({
      $el: t.context.$el,
      root: t.context.component,
    })
  );

  t.is(error.message, "component:tester data must be a function");
});
