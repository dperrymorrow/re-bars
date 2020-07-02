const fs = require("fs");
const Handlebars = require("handlebars");
const { root, replaceExamples, concatPages } = require("./helpers.js");
const nav = require(`${root}/_src/data.json`);
const tpl = fs.readFileSync(`${root}/_src/README.hbs`, "utf-8");
const content = concatPages();

function _replace(pages) {
  return pages.map(page => {
    page.markdown = replaceExamples(page.markdown, false);
    page.pages = _replace(page.pages);
    return page;
  });
}

const data = {
  nav,
  content: _replace(content),
};

fs.writeFileSync(process.cwd() + "/README.md", Handlebars.compile(tpl)(data));
