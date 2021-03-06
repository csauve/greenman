const Roll = require("roll");
const {stripIndent} = require("common-tags");

module.exports = ({style, help, match}) => {
  const roll = new Roll();

  help("roll", stripIndent`
    ${style.em(`!roll [dice]`)}: [dice] can be like "d20", "2d6+1", "5". Defaults to a d20.
    ${style.em(`!5`)}: Rolls a d5.
  `);

  match(/^!5$/, ({reply}) => {
    let result = roll.roll("d5").result;
    if (result == 2) result = style.red(result);
    else if (result == 5) result = style.green(result);
    reply(result);
  });

  match(`^!roll(?:\\s+(.*))?$`, ({reply}, [dice]) => {
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
      reply(`You roll a ${style.em(input)} and get ${style.strong(isNat20 ? `*${result}*` : result)}`);
    } else {
      reply(`Bad format. See ${style.url("https://github.com/troygoode/node-roll")} for some valid formats`);
    }
  });
};
