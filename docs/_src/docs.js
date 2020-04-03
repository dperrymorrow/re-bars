import ReBars from "../../src/index.js";
import Simple from "../examples/app.js";
import Advanced from "../examples/advanced/app.js";
import Counter from "../examples/counter.js";

window.Prism = window.Prism || {};
window.Prism.manual = true;

export default {
  init() {
    ReBars.app({
      $el: document.getElementById("demo-app-simple"),
      root: Simple,
    });

    ReBars.app({
      $el: document.getElementById("demo-app-advanced"),
      root: Advanced,
    });

    ReBars.app({
      $el: document.getElementById("counter-demo"),
      root: Counter,
    });

    _highlight();
    _tabs();
    _scrollSpy();
  },
};

function _scrollSpy() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const id = entry.target.getAttribute("id");
      const $link = document.querySelector(`.side-bar-nav a[href="#${id}"]`);
      if ($link) {
        if (entry.intersectionRatio > 0) $link.classList.add("active");
        else $link.classList.remove("active");
      }
    });
  });

  // Track all sections that have an `id` applied
  document.querySelectorAll("h1,h2").forEach(section => {
    observer.observe(section);
  });
}

function _highlight() {
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
}

function _tabs() {
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
}
