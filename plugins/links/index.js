const c = require("irc-colors");
const R = require("ramda");
const moment = require("moment");
const {stripIndent} = require("common-tags");
const getUrls = require("get-urls");
const calmer = require("../../lib/calmer");
const {getLinkTitle} = require("../../lib/links");
const {getLinks, setLinks, filterResults, findRepost, appendLink} = require("./state");
const bitly = require("./bitly");

const FILENAME = "links.json";

const parseUrlsFromText = (text) => Array.from(getUrls(text));

module.exports = ({bitlyAccessToken, maxSavedLinks}, s3Store, {help, match, filter, style}) => {
  const shorten = bitly(bitlyAccessToken);
  const calm = calmer(0.5, 2);

  const getState = (...args) => s3Store.getState(FILENAME, ...args);
  const saveState = (...args) => s3Store.saveState(FILENAME, ...args);

  const formatTitle = (title, repost) => {
    let prefix = "";
    if (repost) {
      const ago = moment(repost.datePosted).fromNow();
      prefix = `${style.strong("[repost! ")}${style.nick(repost.nick)}${style.strong(`, ${ago}]`)} `;
    }
    let suffix = "";
    if (title) {
      suffix = style.em(title.trim());
    }
    return prefix + suffix;
  };

  const getPostedLinks = (filters, cb) => {
    getState((err, state) => {
      if (err) return cb(err);
      cb(null, filterResults(filters, getLinks(state)));
    });
  };

  const savePostedLink = (link, cb) => {
    getState((err, state) => {
      if (err) return cb(err);
      const prevLinks = getLinks(state);
      const repost = findRepost(link, prevLinks);
      const finalLinks = appendLink(link, prevLinks, maxSavedLinks);
      saveState(setLinks(finalLinks, state), (err) => {
        if (err) return cb(err);
        cb(null, repost);
      });
    });
  };

  help("links", stripIndent`
    Posts titles for links pasted in the channel, and other services:
    ${style.em("!shorten [url...]")}: Shorten the given URL(s) or the last URL posted to the channel
  `);

  match(/^!shorten(?:\s+(.+))?$/i, ({reply, nick, channel}, [arg]) => {
    if (!calm(nick)) {
      reply("Enhance your calm!");
      return;
    }
    if (arg) {
      const urls = parseUrlsFromText(style.clear(arg));
      if (urls.length == 0) {
        return reply("I couldn't find any URL(s) in your message");
      }
      urls.forEach((url) => {
        shorten(url, (err, short) => {
          if (err) console.error("Failed to shorten URL: ", err);
          else if (short) reply(style.url(short));
        });
      });
    } else {
      const filters = {limitN: 1, channel};
      getPostedLinks(filters, (err, links) => {
        if (err) {
          console.error("Failed to get posted URLs: ", err);
          reply("I couldn't do it!!!");
        } else if (links.length == 0) {
          reply("I can't remember any URLs posted here");
        } else {
          shorten(links[0].url, (err, short) => {
            if (err) console.error("Failed to shorten URL: ", err);
            else if (short) reply(style.url(short));
          });
        }
      });
    }
  });

  filter(({nick, channel, message, say}) => {
    if (!message) return true;
    const urls = parseUrlsFromText(style.clear(message));
    const datePosted = new Date().getTime();

    urls.forEach((url) => {
      getLinkTitle(url, (title) => {
        const link = {url, nick, channel, datePosted, title};
        savePostedLink(link, (err, repost) => {
          if (err) {
            console.error("Failed to save posted link: ", err);
          } else if (link.title || repost) {
            say(formatTitle(link.title, repost));
          }
        });
      });
    });

    return true;
  })
};
