const fs = require("fs");
const toml = require("toml");
const connect = require("./lib/bot");
const S3Store = require("./lib/s3store");

const config = toml.parse(fs.readFileSycnc("./config.toml", {encoding: "utf8"}));
const s3Store = new S3Store(config.s3);

connect(config.bot, (bot) => {
  console.log("Initializing plugins");

  //order determines precedence
  require("./plugins/filter")(config.filter, bot);
  require("./plugins/chief")(bot);
  require("./plugins/roll")(bot);
  require("./plugins/hi")(config.bot, bot);
  require("./plugins/die")(bot);
  require("./plugins/wolfram")(config.wolfram, bot);
  require("./plugins/tell")(s3Store, bot);

  require("./plugins/google")(config.google, bot);
  require("./plugins/links")(config.links, bot);
  require("./plugins/eval")(config.eval, bot);
  require("./plugins/quotes")(config.quotes, bot);
});
