import test from "ava";
import Utils from "../../../src/utils/index.js";
import Helpers from "../../helpers.js";
import Config from "../../../src/config.js";

const key = Config.attrs.key;

test.beforeEach(async t => {
  await Helpers.buildFixture(t, "helpers");
});

test.afterEach.always(Helpers.cleanup);

test("adds key to the span", t => {
  const { keyH1, keyH2 } = t.context.scope.$refs();
  t.is(keyH1.getAttribute(key), "Dave");
  t.is(keyH2.getAttribute(key), "Static");
});

test("can find keys on the DOM", t => {
  t.is(Utils.dom.findAttr(key, "Dave").innerHTML, "Dynamic");
  t.is(Utils.dom.findAttr(key, "Static").innerHTML, "Static");
});

test("using keys, updates only patch", async t => {
  const { $refs, rootData, $nextTick } = t.context.scope;
  const { friendFrank, friendEric } = $refs();

  rootData.friends[1].hobby = "running";
  await $nextTick();
  t.is($refs().friendFrank.isEqualNode(friendFrank), true);
  t.is($refs().friendEric.isEqualNode(friendEric), false);
});
