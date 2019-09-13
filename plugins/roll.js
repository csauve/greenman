const Roll = require("roll");

module.exports = ({style, help, match}) => {
  const roll = new Roll();

  help("roll", `${style.em(`!roll [dice]`)}: [dice] can be like "d20", "2d6+1", "5". Defaults to a d20.`);

  match(`^!roll(?:\\s+(.*))?$`, (ctx, [dice]) => {
    let input = dice ? style.clear(dice) : "d20";

    //handle just numeric inputs like "6"
    if (/^\d+$/.test(input)) {
      const sides = Number(input);
      if (sides < 2) return;
      input = `d${sides}`;
    }

    if (roll.validate(input)) {
      const result = roll.roll(input).result;
      const isNat20 = input == "d20" && result == 20;
      ctx.reply(`You roll a ${style.em(input)} and get ${style.strong(isNat20 ? `*${result}*` : result)}`);
    } else {
      ctx.reply(`Bad format. See ${style.url("https://github.com/troygoode/node-roll")} for some valid formats`);
    }
  });
};
