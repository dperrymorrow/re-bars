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
  },
};
