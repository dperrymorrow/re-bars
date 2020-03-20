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
        const toParse = lines
          .map(line => line.replace(leadingSpaces, ""))
          .join("\n")
          .replace(new RegExp(/ \^/, "g"), " `")
          .replace(new RegExp(/\^ /, "g"), "` ");
        return new Handlebars.SafeString(window.marked(toParse));
      },
    },
  });
}
