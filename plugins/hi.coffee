c = require "irc-colors"

module.exports =
  name: "hi"
  help: (config) -> "Fights depression and loneliness by replying to #{c.red "\"hi #{config.bot.nick}\""}"
  init: (bot, config) ->
    bot.msg ///^(?:hello|hi|sup|yo|hey)\s+#{config.bot.nick}\s*$///i, (nick, channel) ->
      bot.say channel, "Hi, #{nick}!"
