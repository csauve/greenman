const {stripIndent} = require("common-tags");
const request = require("request");
const cheerio = require("cheerio");
const calmer = require("../lib/calmer");
const {getLinkTitle, formatLink} = require("../lib/links");
const URL = require("url");

const searchWiby = (query, cb) => {
  request.get(`https://wiby.me/json/?q=${query}`, (err, response, body) => {
    if (err) return cb(err);
    if (!body) return cb();
    //wiby returns some invalid JSON, need to workaround:
    const result = JSON.parse(`[${body}{}]`);
    result.pop();
    if (result.length == 0) return cb();
    cb(null, {
      url: result[0].url.trim(),
      title: result[0].title.trim()
    });
  });
};

const randomWiby = (cb) => {
  request.get("https://wiby.me/surprise/", (err, response, body) => {
    if (err) return cb(err);
    const $ = cheerio.load(body);
    const urlAttrib = $("head meta[http-equiv=refresh]").attr("content");
    const url = urlAttrib.match(/^0; URL='(.+)'$/)[1].trim();
    getLinkTitle(url, (title) => {
      cb(null, {url, title});
    });
  });
};

const searchGoogle = (query, cb) => {
  request.get(`https://www.google.com/search?q=${query}`, (err, response, body) => {
    if (err) return cb(err);
    const $ = cheerio.load(body);
    const firstResult = $("a[href^=\\/url]").first();
    if (!firstResult || firstResult.length == 0) {
      return cb();
    }
    const url = URL.parse(firstResult.attr("href"), true).query.q;
    const title = firstResult.children().first().text();
    if (!title || title.length == 0) {
      getTitleAtUrl(url, (title) => {
        cb(null, {url, title});
      });
    } else {
      cb(null, {url, title});
    }
  });
};

module.exports = ({bingAccountKey, rate, burst}, {style, match, help}) => {
  const calm = calmer(rate, burst);

  help("go", stripIndent`
    Shortcuts for searching and browsing online.
    ${style.em("!g <query>")}: Returns the top search result from Google
    ${style.em("!w [query]")}: Searches using Wiby. If no query is given, a surprise result is returned
  `);

  match(`^!g\\s+(.+)$`, ({reply}, [query]) => {
    if (!calm("g")) {
      reply(style.green("Relax. I'd rather not piss this thing off."));
      return;
    }
    searchGoogle(style.clear(query), (err, result) => {
      if (err) {
        console.error("Failed to search Google: ", err);
        reply(style.aqua("It appears I have crossed a circuit."));
      } else if (!result) {
        reply("No results");
      } else {
        reply(formatLink(style, result));
      }
    });
  });

  match(`^!w(?:\\s+(.+))?$`, ({reply}, [query]) => {
    if (!calm("w")) {
      reply(style.green("Relax. I'd rather not piss this thing off."));
      return;
    }
    if (query) {
      searchWiby(style.clear(query), (err, result) => {
        if (err) {
          console.error("Failed to search Wiby: ", err);
          reply(style.aqua("It appears I have crossed a circuit."));
        } else if (!result) {
          reply("No results");
        } else {
          reply(formatLink(style, result));
        }
      });
    } else {
      randomWiby((err, result) => {
        if (err) {
          console.error("Failed to get random Wiby: ", err);
          reply(style.aqua("It appears I have crossed a circuit."));
        } else {
          reply(formatLink(style, result));
        }
      });
    }
  });
};
