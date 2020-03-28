import Loader from "./loader.js";

export default {
  highlightDOM() {
    document.querySelectorAll(".language-html").forEach($el => {
      if (!$el.innerText.includes("<script src")) {
        $el.classList.remove("language-html");
        $el.classList.add("language-handlebars");
      }
    });

    document.querySelectorAll("code.language-rebars").forEach($el => {
      Loader.filters.rebars($el, $el.innerText);
      $el.classList.remove("language-rebars");
    });

    Prism.highlightAll();

    Array.from(document.querySelectorAll("code.language-javascript .token.string"))
      .filter($el => {
        return $el.innerText.startsWith("~~hbs~~");
      })
      .forEach($el => {
        $el.innerHTML = Prism.highlight($el.innerText.replace("~~hbs~~", ""), Prism.languages.handlebars, "handlebars");
      });
  },
};
