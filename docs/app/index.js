import App from "./main.js";
import ReBars from "../../src/index.js";

export default function() {
  return ReBars.app({
    root: App,
    $el: document.getElementById("docs-app"),
    helpers: {
      markdown({ fn }) {
        const lines = fn(this).split("\n");
        const leadingSpaces = Array(lines[0].length - lines[0].trim().length).join(" ");
        let html = window.marked(lines.map(line => line.replace(leadingSpaces, "")).join("\n"));
        html = html.replace(new RegExp("<del>", "g"), "<code>").replace(new RegExp("</del>", "g"), "</code>");
        return html;
      },
    },
  });
}
