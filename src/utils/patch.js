import Utils from "./index.js";
import Config from "../config.js";

const { attrs, regex } = Config;

function _isEqHtml(html1, html2) {
  const parsed1 = html1.replace(regex.attrs, "");
  const parsed2 = html2.replace(regex.attrs, "");
  return Utils.dom.getShadow(parsed1).isEqualNode(Utils.dom.getShadow(parsed2));
}

export default {
  canPatch: $target =>
    $target.children.length &&
    $target.children.length > 1 &&
    Array.from($target.children).every($el => $el.getAttribute(attrs.key)),

  hasChanged: ($target, html) => !_isEqHtml($target.innerHTML, html),

  compare({ $target, html, instance, store }) {
    const $shadow = Utils.dom.getShadow(html);
    const $vChilds = Array.from($shadow.children);
    const level = Config.logLevel();

    // deletes and updates
    Array.from($target.children).forEach($r => {
      // warn with the real element if we have an undefined key
      if ($r.getAttribute(attrs.key) === "undefined") instance.log(3, "ReBars: key was undefined", $r);

      const $v = Utils.dom.findAttr(attrs.key, $r.getAttribute(attrs.key), $shadow);
      if (!$v) {
        instance.log(level, "ReBars: removing", $r);
        $r.remove();
      } else if (!_isEqHtml($v.innerHTML, $r.innerHTML, true)) {
        instance.log(level, "ReBars: updating", $r, $v);
        $r.replaceWith($v.cloneNode(true));
      }
    });

    // additions
    $vChilds.forEach(($v, index) => {
      const $r = Utils.dom.findAttr(attrs.key, $v.getAttribute(attrs.key), $target);
      if (!$r) {
        instance.log(level, "ReBars: adding", $v);
        $target.append($v.cloneNode(true));
      }
    });

    // sorting
    $vChilds.forEach(($v, index) => {
      const $r = $target.children[index];
      if ($r.getAttribute(attrs.key) !== $v.getAttribute(attrs.key)) $r.replaceWith($v.cloneNode(true));
    });
  },
};
