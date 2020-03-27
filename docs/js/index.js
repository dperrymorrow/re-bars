import ReBars from "./rebars.min.js";
import Loader from "./loader.js";
import Nav from "./nav.js";
import Syntax from "./syntax.js";
import Tabs from "./tabs.js";

export default async function(prefix = "") {
  window.Prism = window.Prism || {};
  window.Prism.manual = true;

  await Loader.addScripts([
    "//cdnjs.cloudflare.com/ajax/libs/marked/0.8.1/marked.min.js",
    "//cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.5.3/handlebars.min.js",
    `${prefix}js/_vendor/prism.min.js`,
  ]);

  await Loader.loadPartials();
  Syntax.highlightDOM();
  Tabs.init();

  ReBars.app({
    root: Nav,
    $el: document.getElementById("nav-container"),
  });

  return true;
}
