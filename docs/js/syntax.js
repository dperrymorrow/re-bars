export default {
  highlightDOM() {
    document.querySelectorAll(".language-html").forEach($el => {
      if (!$el.innerText.includes("<script src")) {
        $el.classList.remove("language-html");
        $el.classList.add("language-handlebars");
      }
    });

    Prism.highlightAll();

    Array.from(document.querySelectorAll("code.language-javascript .token.string"))
      .filter($el => $el.innerText.startsWith("/*hbs*/"))
      .forEach($el => {
        $el.innerHTML = Prism.highlight($el.innerText.replace("/*hbs*/", ""), Prism.languages.handlebars, "handlebars");
      });
  },
};
