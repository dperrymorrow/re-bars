import Utils from "./index.js";

function _isEqHtml(html1, html2) {
  const reg = new RegExp(/data-rbs(.*?)="(.*?)"/g);
  return html1.replace(reg, "") === html2.replace(reg, "");
}

function _insertAt($target, $child, index = 0) {
  if (index >= $target.children.length) $target.appendChild($child);
  else $target.insertBefore($child, $target.children[index]);
}

export default {
  canPatch: $target =>
    $target.children.length &&
    $target.children.length > 1 &&
    Array.from($target.children).every($el => $el.getAttribute("ref")),
  hasChanged: ($target, html) => !_isEqHtml($target.innerHTML, html),

  compare({ app, $target, html }) {
    const $shadow = Utils.dom.getShadow(html);
    const $vChilds = Array.from($shadow.children);

    // deletes and updates
    Array.from($target.children).forEach($r => {
      const $v = Utils.dom.findRef($shadow, $r.getAttribute("ref"));
      if (!$v) $r.remove();
      else if (!_isEqHtml($v.innerHTML, $r.innerHTML)) $r.replaceWith($v.cloneNode(true));
    });

    // additions
    $vChilds.forEach(($v, index) => {
      const $r = Utils.dom.findRef($target, $v.getAttribute("ref"));
      if (!$r) _insertAt($target, $v.cloneNode(true), index);
    });

    // sorting
    $vChilds.forEach(($v, index) => {
      const $r = $target.children[index];
      if ($r.getAttribute("ref") !== $v.getAttribute("ref")) $r.replaceWith($v.cloneNode(true));
    });
  },
};
