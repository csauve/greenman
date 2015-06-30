c = require "irc-colors"

module.exports =
  help: (config) -> """
    Ignore input from certain nicks. Currently configured: #{c.teal config.ignore?.nicks?.join ", "}
  """

  init: (bot, config) ->
    ignoreList = config.ignore?.nicks || []

    bot.use "message", (from, to, text, message, next) ->
      if from not in ignoreList
        next from, to, text, message