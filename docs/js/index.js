window.Prism = window.Prism || {};
window.Prism.manual = true;

document.querySelectorAll(".language-html").forEach($el => {
  if (!$el.innerText.includes("<script src")) {
    $el.classList.remove("language-html");
    $el.classList.add("language-handlebars");
  }
});

Prism.highlightAll();

Array.from(document.querySelectorAll("code.language-javascript .token.string"))
  .filter($el => $el.innerText.trim().startsWith("<") && $el.innerText.trim().endsWith(">"))
  .forEach($el => {
    $el.innerHTML = Prism.highlight($el.innerText, Prism.languages.handlebars, "handlebars");
  });

document.querySelectorAll("nav.tabs button").forEach($el => {
  const $tabs = $el.parentElement.querySelectorAll("*");
  const $containers = $el.parentElement.parentElement.querySelectorAll(".tab-content *");

  $el.addEventListener("click", event => {
    event.preventDefault();
    $tabs.forEach($tab => $tab.classList.remove("active"));
    $containers.forEach($content => $content.classList.remove("active"));
    $el.classList.add("active");
    document.getElementById($el.dataset.target).classList.add("active");
  });
});
