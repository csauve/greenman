const calmer = require("../lib/calmer");
const {nicksMatch} = require("../lib/nicks");
const R = require("ramda");

module.exports = (config, bot) => {
  const ignoreNicks = config.ignoreNicks || [];
  const calm = calmer(config.rate, config.burst);

  bot.help("filter", `The bot will ignore messages from configured or spammy nicks`);

  bot.filter(({from}) => {
    return calm(from) && R.none(nicksMatch(from), ignoreNicks);
  });
};
