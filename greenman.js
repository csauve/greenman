const fs = require("fs");
const toml = require("toml");
const Bot = require("./lib/bot");

const config = toml.parse(fs.readFileSycnc("./config.toml", {encoding: "utf8"}));
const bot = new Bot(config.bot);

console.log("Initializing plugins");
//order determines precedence
require("./plugins/filter")(config.filter, bot);
require("./plugins/chief")(bot);
require("./plugins/roll")(bot);
require("./plugins/hi")(config.bot, bot);
require("./plugins/die")(bot);

require("./plugins/tell")(config.tell, bot);
require("./plugins/wolfram")(config.wolfram, bot);
require("./plugins/google")(config.google, bot);
require("./plugins/links")(config.links, bot);
require("./plugins/eval")(config.eval, bot);
require("./plugins/quotes")(config.quotes, bot);

plugins.forEach(plugin => plugin(bot));

bot.connect();
