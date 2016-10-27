module.exports = init: (bot, config) ->
  bot.msg ///^(?:hello|hi|sup|yo|hey)\s+#{config.bot.nick}\s*$///i, (nick, channel) ->
    bot.say channel, "Hi, #{nick}!"
