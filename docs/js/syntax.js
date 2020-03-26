function _javascript($code) {
  let toHighlight = $code.innerText;
  const isComponent = toHighlight.includes("/*html*/ ");

  if (isComponent) {
    const [tpl, html] = toHighlight.match(/\/\*html\*\/ `([^]+)`/);
    toHighlight = toHighlight.replace(tpl, html);
    const prefix = Prism.highlight("/*html*/ `", Prism.languages.javascript, "javascript");
    const suffix = Prism.highlight("`", Prism.languages.javascript, "javascript");
    const htmlSyntax = Prism.highlight(html, Prism.languages.javascript, "javascript");
    const syntax = Prism.highlight(toHighlight, Prism.languages.javascript, "javascript").replace(
      htmlSyntax,
      `${prefix}${htmlSyntax}${suffix}`
    );

    $code.innerHTML = syntax;
  } else {
    $code.innerHTML = Prism.highlight($code.innerText, Prism.languages.javascript, "javascript");
  }
}

function _html($code) {
  $code.innerHTML = Prism.highlight($code.innerText, Prism.languages.html, "html");
}

export default {
  highlightDOM() {
    Prism.highlightAll();
    // document.querySelectorAll(".language-javascript").forEach(_javascript);
    // document.querySelectorAll(".language-html").forEach(_html);
  },
};
