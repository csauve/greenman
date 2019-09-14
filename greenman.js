const fs = require("fs");
const toml = require("toml");
const connect = require("./lib/bot");
const S3Store = require("./lib/s3store");

const config = toml.parse(fs.readFileSync("./config.toml", {encoding: "utf8"}));
const s3Store = new S3Store(config.s3);

connect(config.bot, (bot) => {
  //order determines precedence
  console.log("Initializing plugins");

  require("./plugins/filter")(config.filter, bot);
  require("./plugins/chief")(bot);
  require("./plugins/roll")(bot);
  require("./plugins/hi")(config.bot, bot);
  require("./plugins/go")(config.go, bot);
  require("./plugins/wolfram")(config.wolfram, bot);
  require("./plugins/tell")(s3Store, bot);
  require("./plugins/links")(config.links, s3Store, bot);
  require("./plugins/quotes")(s3Store, bot);
  require("./plugins/eval")(config.eval, bot);
  require("./plugins/die")(bot);
});
