const fs = require("fs");
const Marked = require("marked");
const Handlebars = require("handlebars");
const { root, replaceExamples, concatPages } = require("./helpers.js");
const nav = require(`${root}/_src/data.json`);

const exampleTpl = Handlebars.compile(fs.readFileSync(`${root}/_src/example.hbs`, "utf-8"));
const tpl = Handlebars.compile(fs.readFileSync(`${root}/_src/index.hbs`, "utf-8"));

const data = {
  nav,
  content: Marked(replaceExamples(concatPages(), true, true)),
};

Handlebars.registerHelper("js", file => {
  const example = fs.readFileSync(`${root}/examples/${file}`, "utf-8");
  return Marked(exampleTpl({ syntax: "javascript", example, render: false, file }));
});

fs.writeFileSync(`${root}/index.html`, tpl(data));
