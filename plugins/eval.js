const {stripIndent} = require("common-tags");
const {VM} = require("vm2");
const R = require("ramda");
const calmer = require("../lib/calmer");
const util = require("util");

const vmGlobals = [
  {symbol: "R", name: "ramda", value: R}
];

module.exports = (config, {match, style, help}) => {
  const {tokenRefillRate, timeout, maxResultLength, maxResultDepth} = config;
  const calm = calmer(tokenRefillRate, 1);

  help("eval", stripIndent`
    Run code in IRC. Must complete in ${timeout}ms.
    ${style.em(`!js <code>`)}: Evaluates JavaScript, with globals ${style.em(vmGlobals.map(({symbol, name}) => `${symbol} (${name})`).join(", "))}
  `);

  match(/^!js\s+(.+)$/i, ({nick, reply}, [code]) => {
    if (!calm(nick)) {
      return reply(style.green("Slow down. You're losing me."));
    }

    try {
      const vm = new VM({timeout});
      vmGlobals.forEach(({symbol, value}) => vm.freeze(value, symbol));
      const result = vm.run(code);
      const inspectedResult = R.replace(/\n\s*/g, " ", util.inspect(result, {
        breakLength: Infinity,
        maxArrayLength: null,
        depth: maxResultDepth
      }));
      reply(inspectedResult.length > maxResultLength ?
        `${style.em(inspectedResult.substr(0, maxResultLength))}... (result truncated)` :
        style.em(inspectedResult)
      );
    } catch (err) {
      reply(`Runtime error: ${style.strong(err.message)}`);
    }
  });
};
