module.exports = (config, bot) => {
  bot.help("hi", "Fights depression and loneliness by replying to greetings");

  bot.match(`^(?:hello|hi|sup|yo|hey|good morning|good evening)(?:\s+${config.nick})?$`, (ctx) => {
    const responses = [
      `Hi, ${ctx.from}!`,
      "Hi",
      "Hello",
      "Greetings, human",
      "Status report?",
      `/me salutes ${ctx.from}`,
      bot.style.red("ᶠᶸᶜᵏᵧₒᵤ")
    ];
    ctx.say(responses[Math.floor(Math.random() * responses.length)]);
  });
};
