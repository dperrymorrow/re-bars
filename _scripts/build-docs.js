const fs = require("fs");
const Handlebars = require("handlebars");
const { register, root } = require("./helpers.js");

register();

const data = require(root + "_src/data.json");
const tpl = Handlebars.compile(fs.readFileSync(root + "_src/index.hbs", "utf-8"));

fs.writeFileSync(root + "index.html", tpl(data));
