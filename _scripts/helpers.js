const Handlebars = require("handlebars");
const Marked = require("marked");
const fs = require("fs");
const root = process.cwd() + "/docs/";

function _wrap(content) {
  return new Handlebars.SafeString(`<div class="markdown-content">${content}</div>`);
}

module.exports = {
  root,
  register() {
    Handlebars.registerHelper("render", function(parse, file) {
      let content = fs.readFileSync(root + file, "utf-8");
      if (parse === "md") return _wrap(Marked(content));
      if (parse === "md:js") return _wrap(Marked(`\`\`\`javascript\n${content}\n\`\`\``));
      return new Handlebars.SafeString(content);
    });
  },
};
