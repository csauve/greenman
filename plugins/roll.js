const Roll = require("roll");
const roll = new Roll();
const c = require("irc-colors");

module.exports = {
  name: "roll",

  help: (config) => (
    `${c.red(`${config.global.prefix}roll <dice>`)}: Roll <dice> like ${c.teal('d20')}, ${c.teal('2d6+1')}, ${c.teal('5')}`
  ),

  init: (bot, config) => {
    bot.any(new RegExp(`${config.global.prefix}roll(?:\\s+(.*))?$`, "i"), (from, to, match) => {
      const input = match[1] != null ? match[1] : "20";

      if (/^\d+$/.test(input)) {
        const sides = Number(input);
        if (sides < 2) return;

        const result = roll.roll(`d${input}`).result;
        bot.reply(from, to, `A ${result} shows on the ${sides}-sided die`);
      } else if (roll.validate(input)) {
        const result = roll.roll(input).result;
        bot.reply(from, to, result);
      } else {
        bot.reply(from, to, `Bad format. See ${c.underline("https://github.com/troygoode/node-roll")} for some valid formats`);
      }
    });
  }
};