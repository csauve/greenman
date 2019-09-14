const R = require("ramda");
const {stripIndent} = require("common-tags");

const FILENAME = "quotes.json";

module.exports = (s3Store, {style, match, help}) => {
  const normalize = (s) => style.clear(s).toLowerCase().trim();
  const quotesEqual = R.curry((q1, q2) => normalize(q1) == normalize(q2));
  const quoteFuzzyMatch = R.curry((query, quote) => normalize(quote).includes(normalize(query)));

  const getQuotes = (state) =>
    R.pathOr([], ["quotes"], state);

  const setQuotes = (quotes, state) =>
    R.assocPath(["quotes"], quotes, state);

  const updateQuotes = (upd, cb) => {
    getState((err, state) => {
      if (err) return cb(err);
      const newQuotes = upd(getQuotes(state));
      saveState(setQuotes(newQuotes, state), (err) => {
        cb(err, err ? null : newQuotes);
      });
    });
  };

  const findQuote = (quotes, query, lastQuote) => {
    if (query) quotes = R.filter(quoteFuzzyMatch(query), quotes);
    if (!query && lastQuote) quotes = R.reject(quotesEqual(lastQuote), quotes);
    if (quotes.length == 0) return null;
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  const getState = (...args) => s3Store.getState(FILENAME, ...args);
  const saveState = (...args) => s3Store.saveState(FILENAME, ...args);
  let lastQuote = null;

  const retrieveQuotes = (cb) => {
    getState((err, state) => {
      if (err) return cb(err);
      cb(null, getQuotes(state));
    });
  };

  help("quotes", stripIndent`
    Save your shitposts for future generations.
    ${style.em(`!q [query]`)}: Posts a random saved quote, optionally within search results
    ${style.em(`!aq <text>`)}: Adds the given quote
    ${style.em(`!dq <text>`)}: Deletes the given quote
  `);

  match(/^!q(?:\s+(.+))?$/i, ({reply}, [query]) => {
    retrieveQuotes((err, quotes) => {
      if (err) return console.error(err);
      const quote = findQuote(quotes, query ? style.clear(query) : null, lastQuote);
      reply(quote ? style.em(quote) : "No results");
      lastQuote = quote;
    });
  });

  match(/^!aq\s+(.+)$/i, ({reply}, [quote]) => {
    updateQuotes(R.append(quote), (err, newQuotes) => {
      reply(err ? "(╯°□°)╯︵ ┻━┻" : `Quote added (${newQuotes.length} total)`);
    });
  });

  match(/^!dq\s+(.+)$/i, ({reply}, [quote]) => {
    updateQuotes(R.reject(quotesEqual(quote)), (err, newQuotes) => {
      reply(err ? "(╯°□°)╯︵ ┻━┻" : `Quote deleted (${newQuotes.length} total)`);
    });
  });
};
