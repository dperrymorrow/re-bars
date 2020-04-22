import test from "ava";
import Helpers from "../../helpers.js";
import Sinon from "sinon";
import Msg from "../../../src/msg.js";

test.afterEach.always(t => {
  if (t.context.$el) t.context.$el.remove();
  Sinon.restore();
});

test("captures the event", async t => {
  let args;
  let methodScope;

  await Helpers.buildContext(t, {
    name: "test",
    template: "<button ref='clicker' {{ method 'clickHandler' }}></button>",
    methods: {
      clickHandler() {
        args = arguments;
        methodScope = this;
      },
    },
  });

  Helpers.trigger(t, "clicker", "click");
  const [event, ...rest] = args;

  t.is(event instanceof MouseEvent, true);
  t.is(event.target, Helpers.ref(t, "clicker"));
  t.is(event.type, "click");
  t.is(methodScope.$name, "test");
  t.is(typeof methodScope.$methods, "object");
});

test("takes an argument for event type", async t => {
  let args;
  await Helpers.buildContext(t, {
    name: "test",
    template: "<button ref='clicker' {{ method 'handler:keyup' 'kechow!' }}></button>",
    methods: {
      handler() {
        args = arguments;
      },
    },
  });

  Helpers.trigger(t, "clicker", "keyup");
  const [event, msg] = args;

  t.is(event instanceof MouseEvent, true);
  t.is(msg, "kechow!");
  t.is(event.type, "keyup");
});

test.serial("throws if method not defined", async t => {
  Sinon.stub(Msg.messages, "noMethod").returns("Kaboom!");
  const { message } = t.throws(() => {
    Helpers.buildContext(t, {
      name: "test",
      template: "<button ref='clicker' {{ method 'noper' }}></button>",
    });
  });
  t.is(message, "Kaboom!");
});

test("takes data as args", async t => {
  let args;
  await Helpers.buildContext(t, {
    name: "test",
    template: "<button ref='clicker' {{ method 'handler' name.first }}></button>",
    data() {
      return { name: { first: "David" } };
    },
    methods: {
      handler() {
        args = arguments;
      },
    },
  });

  Helpers.trigger(t, "clicker");
  const [event, name] = args;

  t.is(event instanceof MouseEvent, true);
  t.is(name, "David");
});
