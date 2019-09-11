const messages = [
  "Sir. Permission to leave the station.",
  "Wake me... When you need me.",
  "Something tells me I'm not gonna like this.",
  "I'll find Cortana's solution. And I'll bring it back.",
  "On Halo, you tried to kill Cortana. You tried to kill me.",
  "So, stay here."
];

module.exports = ({style, help, match}) => {
  help("die", `${style.em("!die")}: Shutdown the bot, which will restart and rejoin afterwards`);

  const shutdown = (ctx) => {
    const msg = messages[Math.floor(Math.random() * messages.length)];
    ctx.say(style.green(msg));
    process.exit();
  };

  match("!die", shutdown);
  match("^greenman go home|go home greenman", shutdown);
};
