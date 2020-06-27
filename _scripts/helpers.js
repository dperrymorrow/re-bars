const Handlebars = require("handlebars");
const Marked = require("marked");
const fs = require("fs");
const root = process.cwd() + "/docs";
const nav = require(`${root}/_src/data.json`);
const exampleTpl = Handlebars.compile(fs.readFileSync(`${root}/_src/example.hbs`, "utf-8"));

function _concat(pages) {
  return pages.reduce((content, page) => {
    if (page.markdown) content += fs.readFileSync(`${root}/_src/md/${page.markdown}`, "utf-8");
    if (page.pages) content += _concat(page.pages);
    return content;
  }, "");
}

module.exports = {
  root,
  concatPages: () => _concat(nav.pages),
  replaceExamples(content, render = false, markdown = false) {
    const parsed = content.replace(/\{\{ example (.*) \}\}/g, function(match, file) {
      const example = fs.readFileSync(`${root}/examples/${file}`, "utf-8");
      return exampleTpl({
        syntax: "javascript",
        example,
        render,
        file,
      });
    });

    return markdown ? Marked(parsed) : parsed;
  },
};
