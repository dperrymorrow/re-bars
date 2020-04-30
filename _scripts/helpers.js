const Handlebars = require("handlebars");
const Marked = require("marked");
const fs = require("fs");
const root = process.cwd() + "/docs/";

function _wrap(content) {
  return new Handlebars.SafeString(`<div class="markdown-content">${content}</div>`);
}

function _parseJs(content) {
  return _wrap(Marked(`\`\`\`javascript\n${content}\n\`\`\``));
}

module.exports = {
  root,
  register() {
    Handlebars.registerHelper("render", function(parse, file, examples) {
      let content = fs
        .readFileSync(root + file, "utf-8")
        .split("\n")
        .map((line, index) => {
          if (line.startsWith(">> example")) {
            let output = "";
            const file = line.replace(">> example ", "");
            const js = fs.readFileSync(`${root}examples/${file}.js`, "utf-8");
            if (examples) output += `<div id="${file}-demo" class="demo-app"></div>\n`;
            return (output += _parseJs(js));
          }
          return line;
        })
        .join("\n");

      if (parse === "md") return _wrap(Marked(content));
      if (parse === "md:js") return _parseJs(content);
      return new Handlebars.SafeString(content);
    });
  },
};
