module.exports = (bot) => {
  bot.help("die", `${bot.styles.em("!die")}: Shutdown the bot, which will restart and rejoin afterwards`)

  bot.match("!die", (ctx) => {
    process.exit();
  });

  bot.match("^greenman go home|go home greenman", (ctx) => {
    process.exit();
  });
};
