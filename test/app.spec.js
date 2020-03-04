const test = require("ava");
const sinon = require("sinon");
const ReBars = require("../dist/index.js");
const Handlebars = require("handlebars");

test.beforeEach(t => {
  window.Handlebars = Handlebars;
  t.context.$el = document.createElement("div");
  document.body.append(t.context.$el);
});

test.afterEach.always(t => {
  t.context.$el.remove();
  sinon.restore();
});

test("ReBars is a function", t => {
  t.is(typeof ReBars, "function");
});

test("throws if element not in document", t => {
  const error = t.throws(() => {
    ReBars({
      $el: document.createElement("div"),
      root: { name: "test", template: "<h1></h1>" },
    });
  });

  t.is(error.message, "$el must be present in the document");
});

test("can create an app", t => {
  ReBars({
    $el: t.context.$el,
    root: { name: "test", template: "<h1>hello world</h1>" },
  });

  t.is(document.querySelector("h1").innerHTML, "hello world");
});

test("returns storage", t => {
  const { storage, id, component } = ReBars({
    $el: t.context.$el,
    root: { name: "test", template: "<h1>hello world</h1>" },
  });

  t.is(typeof storage.comp, "object");
  t.is(typeof id, "string");
  t.is(typeof component, "function");
});

test("each app gets a unique id", t => {
  const invoke = ReBars.bind(null, {
    $el: t.context.$el,
    root: { name: "test", template: "<h1>hello world</h1>" },
  });

  const [id1, id2] = [invoke(), invoke()].map(inst => inst.id);
  t.is(id1 === id2, false);
});

test.serial("needs Handlebars in order to run", t => {
  delete window.Handlebars;

  const error = t.throws(() => {
    ReBars({
      $el: t.context.$el,
      root: { name: "test", template: "<h1></h1>" },
    });
  });

  t.is(error.message, "ReBars need Handlebars in order to run!");
});
