export default async function($el) {
  const src = $el.dataset.src;
  const md = src.endsWith(".md");

  const res = await fetch(src);
  const txt = await res.text();

  $el.innerHTML = md ? window.marked(txt) : txt;

  const hash = window.location.hash;
  if (hash) {
    $el = document.getElementById(hash.replace("#", ""));

    if ($el) {
      $el.scrollIntoView({
        behavior: "smooth", // or "auto" or "instant"
        block: "end", // or "end"
      });
    }
  }
}
