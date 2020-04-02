const fs = require("fs");
const Handlebars = require("handlebars");
const { register, root } = require("./helpers.js");

register();

const data = require(root + "_src/data.json");
data.pages.pop();
const tpl = Handlebars.compile(fs.readFileSync(root + "_src/README.hbs", "utf-8"));

fs.writeFileSync(process.cwd() + "/README.md", tpl(data));
