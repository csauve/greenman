const {stripColorsAndStyle} = require("irc-colors");

module.exports = {
  name: "clean-text",
  help: (config) => "Strips formatting from user messages for downstream plugins",
  init: (bot, config) => {
    bot.use("message", (from, to, text, message, next) => {
      next(from, to, stripColorsAndStyle(text), message, next);
    });
  }
};