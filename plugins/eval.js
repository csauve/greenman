const c = require("irc-colors");
const {stripIndent} = require("common-tags");
const {VM} = require("vm2");
const _ = require("lodash");
const R = require("ramda");
const rateLimit = require("nogo");
const util = require("util");

const vmGlobals = [
  {symbol: "_", name: "lodash", value: _},
  {symbol: "R", name: "ramda", value: R}
];

module.exports = {
  name: "eval",

  help: (config) => stripIndent`
    Run code in IRC. Must complete in ${config.eval.timeout}ms.
    ${c.red(`${config.global.prefix}js <code>`)}: Evaluates JavaScript, with globals ${c.teal(vmGlobals.map(({symbol, name}) => `${symbol} (${name})`).join(", "))}
  `,

  init: (bot, config) => {
    const {tokenRefillRate, timeout, maxResultLength, maxResultDepth} = config.eval;

    //rate limit user JS execution
    const limiter = rateLimit({
      rate: config.eval.tokenRefillRate,
      burst: 1
    });

    //"Slow down. You're losing me."

    bot.msg(new RegExp(`^${config.global.prefix}js\\s+(.+)`, "i"), (nick, channel, match) => {
      limiter(nick, {
        no: () => bot.reply(nick, channel, `Not so fast! Please wait at least ${1 / tokenRefillRate}s between runs`),
        go: () => {
          try {
            const code = match[1];
            const vm = new VM({timeout});
            vmGlobals.forEach(({symbol, value}) => vm.freeze(value, symbol));
            const result = vm.run(code);
            const inspectedResult = R.replace(/\n\s*/g, " ", util.inspect(result, {
              breakLength: Infinity,
              maxArrayLength: null,
              depth: maxResultDepth
            }));
            bot.reply(nick, channel, inspectedResult.length > maxResultLength ?
              `${c.teal(inspectedResult.substr(0, maxResultLength))}... (result truncated)` :
              c.teal(inspectedResult)
            );
          } catch (err) {
            bot.reply(nick, channel, `Runtime error: ${err.message}`);
          }
        }
      });
    });
  }
};
