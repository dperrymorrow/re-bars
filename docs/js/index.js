import ReBars from "./rebars.min.js";
import Loader from "./loader.js";
import Nav from "./nav.js";
import Syntax from "./syntax.js";
import Tabs from "./tabs.js";

export default async function() {
  window.Prism = window.Prism || {};
  window.Prism.manual = true;

  const scripts = [
    "//cdn.jsdelivr.net/npm/prismjs@1.19.0/prism.min.js",
    "//cdn.jsdelivr.net/npm/prismjs@1.19.0/components/prism-markup-templating.min.js",
    "//cdn.jsdelivr.net/npm/prismjs@1.19.0/components/prism-handlebars.min.js",
    "//cdnjs.cloudflare.com/ajax/libs/marked/0.8.1/marked.min.js",
  ];

  if (!window.Handlebars) scripts.push("//cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.5.3/handlebars.min.js");

  await Loader.addScripts(scripts);

  await Loader.loadPartials();
  Syntax.highlightDOM();
  Tabs.init();

  ReBars.app({
    root: Nav,
    $el: document.getElementById("nav-container"),
  });
}
