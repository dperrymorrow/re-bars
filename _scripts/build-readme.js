const fs = require("fs");
const Handlebars = require("handlebars");
const { root, replaceExamples } = require("./helpers.js");
const nav = require(`${root}/_src/data.json`);

const tpl = fs.readFileSync(`${root}/_src/README.hbs`, "utf-8");
const docs = fs.readFileSync(`${root}/_src/docs.md`, "utf-8");

const data = {
  nav,
  content: replaceExamples(docs),
};

fs.writeFileSync(process.cwd() + "/README.md", Handlebars.compile(tpl)(data));
