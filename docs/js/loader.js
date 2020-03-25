export default async function($el) {
  const src = $el.dataset.src;

  const res = await fetch(src);
  const txt = await res.text();
  const classes = [];

  if (src.endsWith(".md")) {
    $el.innerHTML = window.marked(txt);
    classes.push("markdown-content");
  } else if (src.endsWith(".js")) {
    $el.innerHTML = window.marked("```javascript\n" + txt + "```");
    classes.push("markdown-content");
  } else {
    $el.innerHTML = txt;
  }

  $el.classList.add(classes);

  Array.from($el.querySelectorAll(".language-javascript")).forEach($code => {
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
  });

  Array.from($el.querySelectorAll(".language-html")).forEach($code => {
    $code.innerHTML = Prism.highlight($code.innerText, Prism.languages.javascript, "html");
  });

  const hash = window.location.hash;
  if (hash) {
    $el = document.getElementById(hash.replace("#", ""));

    if ($el) {
      $el.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }
}
