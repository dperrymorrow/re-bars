const fs = require("fs");
const Marked = require("marked");
const Handlebars = require("handlebars");
const { root, replaceExamples, concatPages } = require("./helpers.js");
const nav = require(`${root}/_src/data.json`);

const content = concatPages();
const tpl = Handlebars.compile(fs.readFileSync(`${root}/_src/index.hbs`, "utf-8"));

Handlebars.registerHelper("markdown", function(string) {
  if (string) {
    const parsed = replaceExamples(string, true);
    return Marked(parsed);
  }
});

const data = {
  nav,
  content,
};

fs.writeFileSync(`${root}/index.html`, tpl(data));
