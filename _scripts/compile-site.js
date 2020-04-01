const fs = require("fs");
const Handlebars = require("handlebars");
const Marked = require("marked");

const root = process.cwd() + "/docs/";
const data = require(root + "data.json");
const tpl = Handlebars.compile(fs.readFileSync(root + "index.hbs", "utf-8"));

Handlebars.registerHelper("render", function(file) {
  let content = fs.readFileSync(root + file, "utf-8");
  if (file.endsWith(".md")) content = Marked(content);
  if (file.endsWith(".js")) content = Marked(`\`\`\`javascript\n${content}\n\`\`\``);
  return new Handlebars.SafeString(`<div class="markdown-content">${content}</div>`);
});

fs.writeFileSync(root + "index.html", tpl(data));
