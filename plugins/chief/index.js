const {stripIndent} = require("common-tags");
const calmer = require("../../lib/calmer");

const masterchief = require("./masterchief.json");
const cortana = require("./cortana.json");
const arbiter = require("./arbiter.json");
const johnson = require("./johnson.json");
const spark = require("./spark.json");

const MESSAGE_CHANCE = 1 / 1000;
const DAY = 60 * 60 * 24;

const getRandomQuote = (source) => {
  const index = Math.floor(source.quotes.length * Math.random());
  return source.quotes[index];
};

module.exports = ({style, help, match}) => {
  const calm = calmer(1 / DAY, 2);

  help("chief", stripIndent`
    Randomly posts masterchief quotes, or provides them on demand:
    ${style.em("!chief, !cortana, !arbiter, !johnson, !spark")}
  `);

  match("^!cortana$", (ctx) => {
    ctx.say(style.pink(getRandomQuote(cortana)));
  });

  match("^!arbiter$", (ctx) => {
    ctx.say(style.yellow(getRandomQuote(arbiter)));
  });

  match("^!chief$", (ctx) => {
    ctx.say(style.green(getRandomQuote(masterchief)));
  });

  match("^!johnson$", (ctx) => {
    ctx.say(style.brown(getRandomQuote(johnson)));
  });

  match("^!spark$", (ctx) => {
    ctx.say(style.aqua(getRandomQuote(spark)));
  });

  match(".*", (ctx) => {
    if (Math.random() < MESSAGE_CHANCE && calm(ctx.to)) {
      ctx.say(style.green(getRandomQuote(masterchief)));
    }
    return true;
  });
};
