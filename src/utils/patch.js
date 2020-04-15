import Utils from "./index.js";

const _isEqHtml = (html1, html2) => {
  const reg = new RegExp(/data-rbs(.*?)="(.*?)"/g);
  return html1.replace(reg, "") === html2.replace(reg, "");
};

export default {
  canPatch: $target => $target.children.length && Array.from($target.children).every($el => $el.getAttribute("ref")),
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

    // sorting & new ones
    $vChilds.forEach($v => {
      const $r = Utils.dom.findRef($target, $v.getAttribute("ref")) || $v.cloneNode(true);
      if (!$r) $target.appendChild($v.cloneNode(true));
    });
  },
};
