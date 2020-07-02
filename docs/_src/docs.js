import ReBars from "../../src/app.js";

window.Prism = window.Prism || {};
window.Prism.manual = true;
window.ReBars = ReBars;

(function() {
  _highlight();
  // _tabs();
  _scrollSpy();

  function _scrollSpy() {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const id = entry.target.dataset && entry.target.dataset.anchor;
        const $link = document.querySelector(`.side-bar-nav a[href="${id}"]`);
        if ($link) {
          if (entry.intersectionRatio > 0) {
            $link.classList.add("active");
          } else {
            $link.classList.remove("active");
          }
        }
      });
    });

    // Track all sections that have an `id` applied
    document.querySelectorAll("article[data-anchor]").forEach(section => {
      observer.observe(section);
    });

    const $curEl = window.location.hash ? document.querySelector(window.location.hash) : null;
    if ($curEl) $curEl.scrollIntoView();
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
      .filter($el => {
        const txt = $el.innerText.trim();
        return (txt.startsWith("<") || txt.startsWith("{")) && (txt.endsWith(">") || txt.endsWith("}"));
      })
      .forEach($el => {
        $el.innerHTML = Prism.highlight($el.innerText, Prism.languages.handlebars, "handlebars");
      });
  }

  // function _addIntros() {
  //   Array.from(document.querySelectorAll(".content > h1"))
  //     .map($el => $el.nextSibling.nextSibling)
  //     .forEach($p => $p.classList.add("intro"));
  // }

  // function _tabs() {
  //   document.querySelectorAll("nav.tabs button").forEach($el => {
  //     const $tabs = $el.parentElement.querySelectorAll("*");
  //     const $containers = $el.parentElement.parentElement.querySelectorAll(".tab-content *");
  //
  //     $el.addEventListener("click", event => {
  //       event.preventDefault();
  //       $tabs.forEach($tab => $tab.classList.remove("active"));
  //       $containers.forEach($content => $content.classList.remove("active"));
  //       $el.classList.add("active");
  //       document.getElementById($el.dataset.target).classList.add("active");
  //     });
  //   });
  // }
})();
