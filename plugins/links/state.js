const R = require("ramda");
const {nicksMatch} = require("../../lib/nicks");

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

const appendLink = (newLink, oldLinks, maxSavedLinks) =>
  R.takeLast(maxSavedLinks, R.concat(oldLinks, [newLink]));

const isRepost = R.curry((link1, link2) => (
  link1.url == link2.url && link1.channel == link2.channel && !nicksMatch(link1.nick, link2.nick)
));

const findRepost = R.curry((newLink, prevLinks) =>
  R.findLast(isRepost(newLink), prevLinks)
);

module.exports = {
  getLinks,
  setLinks,
  filterResults,
  findRepost,
  appendLink
};
