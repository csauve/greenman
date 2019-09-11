module.exports = (config, {help, match, style}) => {
  help("hi", "Fights depression and loneliness by replying to greetings");

  match(`^(?:hello|hi|sup|yo|hey|good morning|good evening)(?:\s+${config.nick})?$`, (ctx) => {
    const responses = [
      `Hi, ${ctx.from}!`,
      "Hi",
      "Hello",
      style.green("You all right?"),
      style.green("Boo."),
      "Greetings, human",
      "Status report?",
      `/me salutes ${ctx.from}`,
      style.red("ᶠᶸᶜᵏᵧₒᵤ")
    ];
    ctx.say(responses[Math.floor(Math.random() * responses.length)]);
  });
};
