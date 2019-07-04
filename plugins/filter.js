const calmer = require("../lib/calmer");

module.exports = (config, bot) => {
  const ignoreNicks = config.ignoreNicks || [];
  const calm = calmer(config.rate, config.burst);

  bot.help("filter", `The bot will ignore messages from configured or spammy nicks`);

  bot.filter(({from}) => !ignoreNicks.includes(from) && calm(from));
};
