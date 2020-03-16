import test from "ava";
import sinon from "sinon";
import ReBars from "../src/index.js";
import Handlebars from "handlebars";
import Component from "../src/component.js";
import ProxyTrap from "../src/proxy-trap.js";
import Utils from "../src/utils/index.js";
import Core from "../src/helpers/core.js";
import Events from "../src/helpers/events.js";
import Watch from "../src/helpers/watch.js";

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

test("keeps $props separated", t => {
  t.context.def.template = "<div>{{ name }} {{ $props.hobby }}</div>";
  const output = Component.register(t.context.id, Handlebars, t.context.def)
    .instance({ hobby: "bonsai" })
    .render();

  t.is(output.includes("David"), true);
  t.is(output.includes("bonsai"), true);
});

test("methods are scoped to the scope", t => {
  t.context.def.methods = {
    sup() {
      t.is("$methods" in this, true);
      t.is("$props" in this, true);
      t.is("$refs" in this, true);
    },
  };

  const { scope } = Component.register(t.context.id, Handlebars, t.context.def).instance();
  scope.$methods.sup();
});

test("data functions are scoped", t => {
  t.context.def.data = function() {
    return {
      name: "fred",
      computed() {
        t.is(this.name, "fred");
        return this.name;
      },
    };
  };

  const { scope } = Component.register(t.context.id, Handlebars, t.context.def).instance();
  t.is(scope.computed(), "fred");
});

test("scope returns keys", t => {
  const { scope } = Component.register(t.context.id, Handlebars, t.context.def).instance();
  t.is(typeof scope.$refs, "function");
  t.is(typeof scope.$props, "object");
  t.is(typeof scope.$methods, "object");
  t.is(typeof scope.$watchers, "object");
  t.is(typeof scope.$hooks, "object");
  t.is(typeof scope.$name, "string");
});

test("hook created gets called with scope of the instance", t => {
  t.context.def.data = () => ({ name: "dave" });
  t.context.def.hooks = {
    created() {
      t.is(this.name, "dave");
    },
  };

  Component.register(t.context.id, Handlebars, t.context.def).instance();
});

test.serial("registers core helpers for instance", t => {
  sinon.stub(Core, "register");

  Component.register(t.context.id, Handlebars, t.context.def).instance();
  const { appId, instance, helpers, name } = Core.register.lastCall.args[0];

  t.is(typeof helpers, "object");
  t.is(typeof appId, "string");
  t.is(typeof instance, "object");
  t.is(name, "test");
});

test.serial("registers event helpers for instance", t => {
  sinon.stub(Events, "register");
  Component.register(t.context.id, Handlebars, t.context.def).instance();
  t.is(typeof Events.register.lastCall.args[0], "object");
});

test.serial("registers watch helpers for instance", t => {
  sinon.stub(Watch, "register");
  Component.register(t.context.id, Handlebars, t.context.def).instance();
  t.is(typeof Watch.register.lastCall.args[0], "object");
});

test.serial("creates a proxy trap", t => {
  const watchStub = sinon.stub();
  sinon.stub(ProxyTrap, "create").returns({ data: { name: "fred", $props: { thing: true } }, watch: watchStub });
  const { scope } = Component.register(t.context.id, Handlebars, t.context.def).instance({
    hello: "prop",
  });
  const args = ProxyTrap.create.lastCall.args[0];

  t.is(args.$props.hello, "prop");
  t.is(args.$name, "test");
  t.is(scope.$props.thing, true);
  t.is(scope.name, "fred");
  t.is(watchStub.called, false);
});

test.serial("does not begin watching until after render", t => {
  const watchStub = sinon.stub();

  sinon.stub(ProxyTrap, "create").returns({ data: {}, watch: watchStub });
  sinon.stub(Utils.dom, "tagComponent").returns("theWrapper");

  const { render } = Component.register(t.context.id, Handlebars, t.context.def).instance();

  t.is(watchStub.called, false);
  t.is(render(), "theWrapper");
  t.is(watchStub.called, true);
});
