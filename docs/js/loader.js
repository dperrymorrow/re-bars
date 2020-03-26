async function _loadPartial($el) {
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

export default {
  addScripts(srcs) {
    return Promise.all(
      srcs.map(src => {
        return new Promise(resolve => {
          var script = document.createElement("script");
          script.type = "text/javascript";
          script.src = src;
          script.onload = resolve;
          document.head.appendChild(script);
        });
      })
    );
  },

  async loadPartials() {
    await Promise.all(
      Array.from(document.querySelectorAll("[data-src]")).map($el => {
        return _loadPartial($el);
      })
    );
  },
};
