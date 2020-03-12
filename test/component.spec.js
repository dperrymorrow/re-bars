import test from "ava";
import sinon from "sinon";
import ReBars from "../src/index.js";
import Handlebars from "handlebars";
import Component from "../src/component.js";
import Helpers from "../src/helpers.js";
import ProxyTrap from "../src/proxy-trap.js";
import Utils from "../src/utils.js";

test.beforeEach(t => {
  window.Handlebars = Handlebars;
  t.context.$el = document.createElement("div");
  document.body.append(t.context.$el);

  const { id } = ReBars.app({
    $el: t.context.$el,
    root: { name: "root", template: "<h1></h1>" },
  });

  t.context.def = {
    template: "<h1>{{ name }}</h1>",
    name: "test",
    data: () => ({ name: "David" }),
  };

  t.context.id = id;
});

test.afterEach.always(t => {
  t.context.$el.remove();
  sinon.restore();
});

test("will render the component as root", t => {
  const output = Component.register(t.context.id, Handlebars, t.context.def)
    .instance()
    .render();

  t.is(output.includes(">David</h1>"), true);
  t.is(output.includes("data-rbs-comp="), true);
});

test("combines props with data for scope", t => {
  t.context.def.template = "<div>{{ name }} {{ hobby }}</div>";
  const output = Component.register(t.context.id, Handlebars, t.context.def)
    .instance({ hobby: "bonsai" })
    .render();

  t.is(output.includes("David"), true);
  t.is(output.includes("bonsai"), true);
});

test("props take precident over data", t => {
  sinon.stub(console, "warn");
  const output = Component.register(t.context.id, Handlebars, t.context.def)
    .instance({ name: "morrow" })
    .render();

  t.is(output.includes("David"), false);
  t.is(output.includes("morrow"), true);
});

test("prop functions are combined with methods", t => {
  t.context.def.methods = { sup() {} };

  const { methods, $props } = Component.register(t.context.id, Handlebars, t.context.def).instance({ propMethod() {} });

  t.is("propMethod" in methods, true);
  t.is("sup" in methods, true);
  t.is("propMethod" in $props, false);
});

test("methods are scoped to the scope", t => {
  t.context.def.methods = {
    sup() {
      t.is("methods" in this, true);
      t.is("data" in this, true);
      t.is("$props" in this, true);
      t.is("$refs" in this, true);
    },
  };

  const { methods } = Component.register(t.context.id, Handlebars, t.context.def).instance();
  methods.sup();
});

test("data functions are scoped to data", t => {
  t.context.def.data = function() {
    return {
      name: "fred",
      computed() {
        t.is(this.name, "fred");
        return this.name;
      },
    };
  };

  const { data } = Component.register(t.context.id, Handlebars, t.context.def).instance();
  t.is(data.computed(), "fred");
});

test("scope returns keys", t => {
  const inst = Component.register(t.context.id, Handlebars, t.context.def).instance();
  t.is(typeof inst.data, "object");
  t.is(typeof inst.$refs, "function");
  t.is(typeof inst.$props, "object");
  t.is(typeof inst.methods, "object");
  t.is(typeof inst.watchers, "object");
  t.is(typeof inst.hooks, "object");
});

test("hook created gets called with scope of the instance", t => {
  t.context.def.data = () => ({ name: "dave" });
  t.context.def.hooks = {
    created() {
      t.is(this.data.name, "dave");
    },
  };

  Component.register(t.context.id, Handlebars, t.context.def).instance();
});

test("registers helpers for instance", t => {
  sinon.stub(Helpers, "register");
  Component.register(t.context.id, Handlebars, t.context.def).instance();
  const { components, helpers, instance, methods, name } = Helpers.register.lastCall.args[1];

  t.is(Array.isArray(components), true);
  t.is(typeof helpers, "object");
  t.is(typeof instance, "object");
  t.is(typeof methods, "object");
  t.is(name, "test");
});

test.serial("creates a proxy trap", t => {
  const watchStub = sinon.stub();
  sinon.stub(ProxyTrap, "create").returns({ data: { name: "fred" }, watch: watchStub });
  const { $props, methods, watchers, data } = Component.register(t.context.id, Handlebars, t.context.def).instance({
    hello: "prop",
  });
  const args = ProxyTrap.create.lastCall.args[0];

  t.is($props.hello, "prop");
  t.is(data.name, "fred");
  t.is(methods, args.methods);
  t.is(watchers, args.watchers);
  t.is(watchStub.called, false);
});

test.serial("does not begin watching until after render", t => {
  const watchStub = sinon.stub();

  sinon.stub(ProxyTrap, "create").returns({ data: {}, watch: watchStub });
  sinon.stub(Utils, "tagComponent").returns("theWrapper");

  const { render } = Component.register(t.context.id, Handlebars, t.context.def).instance();

  t.is(watchStub.called, false);
  t.is(render(), "theWrapper");
  t.is(watchStub.called, true);
});
