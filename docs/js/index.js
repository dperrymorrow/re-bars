import ReBars from "./rebars.min.js";
import Loader from "./loader.js";
import Nav from "./nav.js";
import Syntax from "./syntax.js";

export default async function() {
  window.Prism = window.Prism || {};
  window.Prism.manual = true;

  await Loader.addScripts([
    "//cdnjs.cloudflare.com/ajax/libs/marked/0.8.1/marked.min.js",
    "//cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.5.3/handlebars.min.js",
    // "//cdnjs.cloudflare.com/ajax/libs/prism/1.19.0/components/prism-handlebars.min.js",
    "//cdnjs.cloudflare.com/ajax/libs/prism/1.19.0/prism.min.js",
    "//cdnjs.cloudflare.com/ajax/libs/prism/1.19.0/plugins/autoloader/prism-autoloader.min.js",
  ]);

  await Loader.loadPartials();
  Syntax.highlightDOM();

  ReBars.app({
    root: Nav,
    $el: document.getElementById("nav-container"),
  });

  return true;
}
