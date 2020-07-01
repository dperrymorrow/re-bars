const fs = require("fs");
const Handlebars = require("handlebars");
const { root, replaceExamples, concatPages } = require("./helpers.js");
const nav = require(`${root}/_src/data.json`);


return

const tpl = fs.readFileSync(`${root}/_src/README.hbs`, "utf-8");

const data = {
  nav,
  content: replaceExamples(concatPages()),
};

fs.writeFileSync(process.cwd() + "/README.md", Handlebars.compile(tpl)(data));
