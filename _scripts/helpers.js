const Handlebars = require("handlebars");
const Marked = require("marked");
const fs = require("fs");
const root = process.cwd() + "/docs";
const exampleTpl = Handlebars.compile(fs.readFileSync(`${root}/_src/example.hbs`, "utf-8"));

module.exports = {
  root,
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
