module.exports = init: (bot, config) ->
  ignoreList = config.ignore?.nicks || []

  bot.use "message", (from, to, text, message, next) ->
    if from not in ignoreList
      next from, to, text, message