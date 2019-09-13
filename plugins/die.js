module.exports = ({style, help, match}) => {
  const messages = [
    style.green("Sir. Permission to leave the station."),
    style.green("Wake me... When you need me."),
    style.green("Something tells me I'm not gonna like this."),
    style.green("I'll find Cortana's solution. And I'll bring it back."),
    style.green("On Halo, you tried to kill Cortana. You tried to kill me."),
    style.green("So, stay here."),
    style.pink("Now would be a very good time to leave!"),
    style.yellow("I am already dead.")
  ];

  help("die", `${style.em("!die")}: Shutdown the bot, which will restart and rejoin afterwards`);

  const shutdown = (ctx) => {
    const msg = messages[Math.floor(Math.random() * messages.length)];
    ctx.say(msg);
    //todo: too early
    process.exit();
  };

  match("!die", shutdown);
  match("^greenman go home|go home greenman", shutdown);
};
