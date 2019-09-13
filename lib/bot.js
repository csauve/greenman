const irc = require("irc");
const R = require("ramda");
const c = require("irc-colors"); //todo: remove dependency?

const makeCtx = (deliver, ctx) => ({
  ...ctx,
  say: (text) => {
    if (ctx.to.startsWith("#")) {
      deliver({channel: ctx.to, text});
    } else {
      deliver({nick: ctx.from, text});
    }
  },
  reply: (text) => {
    if (ctx.to.startsWith("#")) {
      deliver({nick: ctx.from, channel: ctx.to, text});
    } else {
      deliver({nick: ctx.from, text});
    }
  },
  pm: (text) => {
    deliver({nick: ctx.from, text});
  }
});

module.exports = (config, callback) => {
  const chain = [];
  const pages = {};
  const style = {
    ...c,
    ...R.map((colour) => c[colour], config.styles),
    clear: c.stripColorsAndStyle
  };

  console.log(`Connecting to ${config.server} as ${config.nick}`);
  const client = new irc.Client(
    config.server,
    config.nick,
    config.options
  );

  const deliver = ({nick, channel, text}) => {
    if (nick && channel) {
      //mention in channel
      client.say(channel, `${style.nick(nick)}: ${text}`);
    } else if (nick && !channel) {
      //private message
      client.say(nick, text);
    } else if (!nick && channel) {
      //channel broadcast
      client.say(channel, text);
    } else {
      //global broadcast
      for (let channel of config.options.channels) {
        client.say(channel, `${style.strong("[broadcast]")} ${text}`);
      }
    }
  };

  const use = (...callbacks) => {
    chain.push(...callbacks);
  };

  const filter = (predicate) => {
    use((next, ctx) => {
      if (predicate(ctx)) {
        next(ctx);
      }
    });
  };

  const help = (page, text) => {
    pages[page] = text;
  };

  const match = (pattern, cb) => {
    use((next, ctx) => {
      const regexp = typeof(pattern) == "string" ?
        new RegExp(pattern, "i") :
        pattern;
      const match = ctx.message.match(regexp);
      if (match) {
        if (cb(ctx, match.slice(1)) === true) {
          next(ctx);
        }
      } else {
        next(ctx);
      }
    });
  };

  client.addListener("message", (from, to, message) => {
    try {
      chain.reduceRight(
        (next, cb) => {
          return (ctx) => {
            cb(next, makeCtx(deliver, ctx));
          };
        },
        () => {} //unhandled
      )(makeCtx(deliver, {from, to, message}));
    } catch (err) {
      console.error(`Uncaught error handling message: ${err.stack}`);
    }
  });

  client.addListener("registered", () => {
    match("!help (\\w+)", (ctx, [page]) => {
      ctx.reply(pages[page] || `Help not found for \"${page}\". Try ${style.em(`!help`)} for a list of plugins`);
    });

    match("!help", (ctx) => {
      const results = R.keys(pages).join(", ");
      ctx.reply(`Use ${style.em(`!help <plugin>`)} to learn more about these plugins: ${style.em(results)}`);
    });

    //comprises the API for plugins:
    callback({
      deliver,
      use,
      filter,
      help,
      match,
      style
    });
  });
};
