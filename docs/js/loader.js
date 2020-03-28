const filters = {
  javascript($el, content) {
    const regex = /\/\*html\*\/ `([^]+?)`/;
    const tpl = content.match(regex)[1];
    const output = "```javascript\n" + content.replace(tpl, `/*hbs*/${tpl}`) + "\n```\n";
    $el.innerHTML = window.marked(output);
  },

  markdown($el, content) {
    $el.innerHTML = window.marked(content);
  },
};

async function _loadPartial($el) {
  const src = $el.dataset.src;
  const filter = $el.dataset.filter;
  const res = await fetch(src);
  const txt = await res.text();

  if (filter) filters[filter]($el, txt);
  else $el.innerHTML = txt;
}

export default {
  filters,
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

    const hash = window.location.hash;
    if (hash) {
      const $el = document.getElementById(hash.replace("#", ""));

      if ($el) {
        $el.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }
    }
  },
};
