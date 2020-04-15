import Dom from "./dom.js";

const _isEqHtml = (html1, html2) => {
  const reg = new RegExp(/data-rbs(.*?)="(.*?)"/g);
  return html1.replace(reg, "") === html2.replace(reg, "");
};

export default {
  canPatch: $target => $target.children.length && Array.from($target.children).every($el => $el.dataset.rbsRef),
  hasChanged: ($target, html) => !_isEqHtml($target.innerHTML, html),

  compare($target, html) {
    const $shadow = Dom.getShadow(html);
    const $vChilds = Array.from($shadow.children);

    // deletes and updates
    Array.from($target.children).forEach($r => {
      const $v = Dom.findRef($shadow, $r.dataset.rbsRef);
      if (!$v) $r.remove();
      else if (!_isEqHtml($v.innerHTML, $r.innerHTML)) $r.replaceWith($v.cloneNode(true));
    });

    // additions and order;
    $vChilds.forEach(($v, vIndex) => {
      const $r = $target.children[vIndex];
      if (!$r) $target.append($v.cloneNode(true));
      else if (!_isEqHtml($v.innerHTML, $r.innerHTML)) $r.replaceWith($v.cloneNode(true));
    });
  },
};
