export default async function($el) {
  const src = $el.dataset.src;

  const res = await fetch(src);
  const txt = await res.text();

  if (src.endsWith(".md")) {
    $el.innerHTML = window.marked(txt);
    $el.classList.add("markdown-body");
  } else {
    $el.innerHTML = txt;
  }

  Array.from($el.querySelectorAll(".language-javascript")).forEach($code => {
    $code.innerHTML = Prism.highlight($code.innerText, Prism.languages.javascript, "javascript");
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
