const c = require("irc-colors");
const R = require("ramda");
const {stripIndent} = require("common-tags");
const S3FileStateStore = require("./common/s3store");

const sanitize = (s) => c.stripColorsAndStyle(s).trim();
const normalize = (s) => sanitize(s).toLowerCase();
const quotesEqual = R.curry((q1, q2) => normalize(q1) == normalize(q2));
const quoteFuzzyMatch = R.curry((query, quote) => normalize(quote).includes(normalize(query)));

const findQuote = (quotes, query, lastQuote) => {
  if (query) quotes = R.filter(quoteFuzzyMatch(query), quotes);
  if (!query && lastQuote) quotes = R.reject(quotesEqual(lastQuote), quotes);
  if (quotes.length == 0) return null;
  return quotes[Math.floor(Math.random() * quotes.length)];
};

const getQuotes = (state) =>
  R.pathOr([], ["quotes"], state);

const setQuotes = (quotes, state) =>
  R.assocPath(["quotes"], quotes, state);

const updateQuotes = (datastore, upd, cb) => {
  datastore.getState((err, state) => {
    if (err) return cb(err);
    const newQuotes = upd(getQuotes(state));
    datastore.saveState(setQuotes(newQuotes, state), (err) => {
      cb(err, err ? null : newQuotes);
    });
  });
};

const retrieveQuotes = (datastore, cb) => {
  datastore.getState((err, state) => {
    if (err) return cb(err);
    cb(null, getQuotes(state));
  });
};

module.exports = {
  name: "quotes",
  help: (config) => stripIndent`
    Save your shitposts for future generations.
    ${c.red(`${config.global.prefix}q [query]`)}: Posts a random saved quote, optionally within search results
    ${c.red(`${config.global.prefix}aq <text>`)}: Adds the given quote
    ${c.red(`${config.global.prefix}dq <text>`)}: Deletes the given quote
  `,

  init: (bot, config) => {
    const datastore = new S3FileStateStore(config.global.sharedS3Bucket, "quotes.json", config.global.aws);
    let lastQuote = null;

    bot.msg(new RegExp(`^${config.global.prefix}q(?:\\s+(.+))?$`, "i"), (nick, channel, match) => {
      retrieveQuotes(datastore, (err, quotes) => {
        if (err) return console.error(err);
        const quote = findQuote(quotes, match[1], lastQuote);
        bot.reply(nick, channel, quote ? c.teal(quote) : "No results");
        lastQuote = quote;
      });
    });

    bot.msg(new RegExp(`^${config.global.prefix}aq\\s+(.+)$`, "i"), (nick, channel, match) => {
      updateQuotes(datastore, R.append(sanitize(match[1])), (err, newQuotes) => {
        bot.reply(nick, channel, err ? "(╯°□°)╯︵ ┻━┻" : `Quote added (${newQuotes.length} total)`);
      });
    });

    bot.msg(new RegExp(`^${config.global.prefix}dq\\s+(.+)$`, "i"), (nick, channel, match) => {
      updateQuotes(datastore, R.reject(quotesEqual(match[1])), (err, newQuotes) => {
        bot.reply(nick, channel, err ? "(╯°□°)╯︵ ┻━┻" : `Quote deleted (${newQuotes.length} total)`);
      });
    });
  }
};