const Roll = require("roll");

module.exports = ({style, help, match}) => {
  const roll = new Roll();

  help("roll", `${style.em(`!roll <dice>`)}: <dice> can be like "d20", "2d6+1", "5")}`);

  match(`^!roll(?:\\s+(.*))?$`, (ctx, [dice]) => {
    const input = style.clear(dice) || "20";

    if (/^\d+$/.test(input)) {
      const sides = Number(input);
      if (sides < 2) return;

      const result = roll.roll(`d${input}`).result;
      ctx.reply(`A ${style.em(result)} shows on the ${sides}-sided die`);
    } else if (roll.validate(input)) {
      const result = roll.roll(input).result;
      ctx.reply(result);
    } else {
      ctx.reply(`Bad format. See ${c.underline("https://github.com/troygoode/node-roll")} for some valid formats`);
    }
  });
};
