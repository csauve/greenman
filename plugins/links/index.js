const c = require("irc-colors");
const R = require("ramda");
const {stripIndent} = require("common-tags");
const getTitleAtUrl = require("url-to-title");
const getUrls = require("get-urls");
const normalizeUrl = require("normalize-url");
const async = require("async");
const BitlyAPI = require("node-bitlyapi");
const parseDuration = require("parse-duration");
const renderDigest = require("./renderDigest");
const uuid = require("uuid/v4");
const S3FileStateStore = require("../common/s3store");
const s3Temp = require("../common/s3tmp");

const getLinks = (state) => R.pathOr([], ["links"], state);
const setLinks = (quotes, state) => R.assocPath(["links"], quotes, state);

const filterResults = ({limitN, since, channel}, links) => {
  const filterPredicate = ({channel: linkChannel}) => !channel || linkChannel == channel;
  const limitPredicate = ({datePosted}, i) => (!limitN || i < limitN) && (!since || datePosted >= since);
  return R.pipe(
    R.filter(filterPredicate),
    R.addIndex(R.takeLastWhile)(limitPredicate)
  )(links);
};

const lookupLinks = (datastore, filters, cb) => {
  datastore.getState((err, state) => {
    if (err) return cb(err);
    cb(null, filterResults(filters, getLinks(state)));
  });
};

const appendLinks = (oldLinks, newLinks, maxSavedLinks) =>
  R.takeLast(maxSavedLinks, R.concat(oldLinks, newLinks));

const saveLinks = (datastore, links, maxSavedLinks, cb) => {
  datastore.getState((err, state) => {
    if (err) return cb(err);
    const newLinks = appendLinks(getLinks(state), links, maxSavedLinks);
    datastore.saveState(setLinks(newLinks, state), (err) => {
      cb(err, err ? null : newLinks);
    });
  });
};

const parseUrlsFromText = (text) => Array.from(getUrls(text));

//library doesn't trim -- also ignore errors
const getLinkTitle = (url, cb) => {
  getTitleAtUrl(url, (err, title) => cb(title.trim()));
};

const formatTitle = (title) => title ? c.teal(`"${title.trim()}"`) : null;

const shorten = (Bitly, longUrl, callback) => {
  const params = {
    longUrl: normalizeUrl(longUrl).trim(),
    format: "txt",
    domain: "j.mp"
  };
  Bitly.shorten(params, (error, result) => {
    callback(error, result ? result.trim() : null);
  });
};

const shortenAndReply = (bot, nick, channel, urls) => {
  if (urls.length == 0) {
    bot.reply(nick, channel, "I couldn't find a URL to shorten");
  } else {
    urls.forEach((url) => {
      shorten(url, (err, short) => {
        if (short) bot.reply(nick, channel, c.underline(short));
      });
    });
  }
};

const parseLookupFilters = (channel, s, defaultS) => {
  s = s ? s.trim() : null;
  if (!s || s == "") s = defaultS;
  const filters = {channel};
  if (!isNaN(s) && isFinite(s)) {
    filters.limitN = Math.max(1, parseInt(s, 10));
  } else {
    const dur = parseDuration(s);
    if (dur != 0) filters.since = new Date().getTime() - dur;
  }
  return filters;
};

module.exports = {
  name: "links",
  help: (config) => stripIndent`
    Posts titles for links pasted in the channel, and other services:
    ${c.red(`${config.global.prefix}shorten <url ...>`)}: Shorten the given URL(s)
    ${c.red(`${config.global.prefix}shorten`)}: Shorten the last URL posted to this channel (excluding ignored users)
    ${c.red(`${config.global.prefix}digest [n|duration=${config.links.defaultDuration}]`)}: Generate a digest of recently posted links
    The maximum size of digests is configured to ${config.links.maxSavedLinks} links
  `,

  getFormattedTitle: (url, cb) => {
    getLinkTitle(url, R.pipe(formatTitle, cb));
  },

  init: (bot, config) => {
    const Bitly = new BitlyAPI({});
    Bitly.setAccessToken(config.bitly.accessToken);
    const datastore = new S3FileStateStore(config.global.sharedS3Bucket, "links.json", config.global.aws);

    bot.msg(new RegExp(`^${config.global.prefix}shorten(?:\\s+(.+))?$`, "i"), (nick, channel, match) => {
      if (match[1]) {
        shortenAndReply(bot, nick, channel, parseUrlsFromText(match[1]));
      } else {
        lookupLinks(datastore, {limitN: 1}, (err, links) => {
          if (err) return;
          shortenAndReply(bot, nick, channel, links.map(({url}) => url));
        });
      }
    });

    bot.msg(new RegExp(`^${config.global.prefix}digest(?:\\s+(.+))?$`, "i"), (nick, channel, match) => {
      const filters = parseLookupFilters(channel, match[1], config.links.defaultDuration);
      lookupLinks(datastore, filters, (err, links) => {
        if (err) {
          bot.reply(nick, channel, "Failed to get links");
          return;
        }
        const html = renderDigest(links, filters);
        s3Temp.store(
          config.global.aws,
          {folder: "digests", bucket: config.global.sharedS3Bucket, urlBase: config.links.digestUrlBase},
          html,
          "text/html;charset=utf-8",
          `digest-${uuid()}.html`,
          (err, publicUrl) => {
            if (err) {
              bot.reply(nick, channel, "I failed, maybe try again. Or dont, see if I care. ┐( ˘_˘)┌");
              return;
            }
            bot.reply(nick, channel, `Here's your digest: ${c.underline(publicUrl)}`);
          }
        );
      });
    });

    bot.msg((nick, channel, text) => {
      const urls = parseUrlsFromText(text);
      const datePosted = new Date().getTime();
      const buildLink = (url, cb) => {
        getLinkTitle(url, (title) => {
          cb(null, {url, nick, channel, datePosted, title});
        });
      };

      async.map(urls, buildLink, (err, links) => {
        if (err) return console.error(err);
        saveLinks(datastore, links, config.links.maxSavedLinks, (err) => {
          if (err) console.error(err);
        });
        links.forEach(({url, title}) => {
          if (title) bot.say(channel, formatTitle(title));
        });
      });
    });
  },
};
