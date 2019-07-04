const irc = require("irc");
const R = require("ramda");
const c = require("irc-colors");

class Bot {
  constructor(config) {
    this.chain = [];
    this.pages = {};
    this.config = config;
    this.style = {
      ...c,
      ...R.map((colour) => c[colour], this.config.styles),
      clear: c.stripColorsAndStyle
    };
  }

  connect() {
    console.log(`Connecting to ${this.config.server} as ${this.config.nick}`);

    const client = new irc.Client(
      this.config.server,
      this.config.nick,
      this.config.options
    );

    const makeCtx = (ctx) => ({
      ...ctx,
      say: (text) => {
        if (ctx.to.startsWith("#")) {
          client.say(ctx.to, text);
        } else {
          client.say(ctx.from, text);
        }
      },
      reply: (text) => {
        if (ctx.to.startsWith("#")) {
          client.say(ctx.to, `${ctx.from}: ${text}`);
        } else {
          client.say(ctx.from, text);
        }
      },
      pm: (text) => {
        client.say(ctx.from, text);
      }
    });

    client.addListener("message", (from, to, message) => {
      try {
        this.chain.reduceRight(
          (next, cb) => {
            return (ctx) => {
              cb(next, makeCtx(ctx));
            };
          },
          () => {} //unhandled
        )(makeCtx({from, to, message}));
      } catch (err) {
        console.error(`Uncaught error handling message: ${error.stack}`);
      }
    });

    this.match("!help (\\w+)", (ctx, [page]) => {
      ctx.reply(this.pages[page] || `Help not found for \"${page}\". Try ${this.style.em(`!help`)} for a list of plugins`);
    });

    this.match("!help", (ctx) => {
      const results = R.keys(this.pages).join(", ");
      ctx.reply(`Use ${this.style.em(`!help <plugin>`)} to learn more about these plugins: ${this.style.em(results)}`);
    });
  }

  use(...callbacks) {
    this.chain.push(...callbacks);
  }

  filter(predicate) {
    this.use((next, ctx) => {
      if (predicate(ctx)) {
        next(ctx);
      }
    });
  }

  help(page, text) {
    this.pages[page] = text;
  }

  match(pattern, callback) {
    this.use((next, ctx) => {
      const match = message.match(new RegExp(pattern, "i"));
      if (match) {
        if (callback(ctx, match.slice(1)) === true) {
          next(ctx);
        };
      } else {
        next(ctx);
      }
    });
  }
}

module.exports = Bot;
