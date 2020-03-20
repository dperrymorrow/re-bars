import ReBars from "../../src/index.js";
import Loader from "./loader.js";
import Nav from "./nav.js";

export default function() {
  ReBars.app({
    root: Nav,
    $el: document.getElementById("docs-nav"),
  });

  document.querySelectorAll("[data-src]").forEach(Loader);
}
