const Handlebars = require("handlebars");
const fs = require("fs");
const root = process.cwd() + "/docs";
const nav = require(`${root}/_src/data.json`);
const exampleTpl = Handlebars.compile(fs.readFileSync(`${root}/_src/example.hbs`, "utf-8"));

function _concat(pages) {
  return pages.reduce((content, { markdown, pages, path, label }) => {
    content.push({
      path,
      markdown: markdown ? fs.readFileSync(`${root}/_src/md/${markdown}`, "utf-8") : `## ${label}`,
      pages: pages ? _concat(pages) : [],
    });

    return content;
  }, []);
}

function fileName(file) {
  return file
    .replace(/-/g, "/")
    .replace(".js", "")
    .split("/")
    .map(seg => seg.charAt(0).toUpperCase() + seg.slice(1))
    .join("");
}

module.exports = {
  root,
  fileName,
  concatPages: () => _concat(nav.pages),
  replaceExamples(content, render = false) {
    const parsed = content.replace(/\{\{ example (.*) \}\}/g, function(match, file) {
      const example = fs.readFileSync(`${root}/examples/${file}`, "utf-8");
      return exampleTpl({
        syntax: "javascript",
        example,
        render,
        file,
        name: fileName(file),
      });
    });

    return parsed;
  },
};
