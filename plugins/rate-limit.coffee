rateLimit = require "nogo"

module.exports =
  name: "rate-limit"

  help: (config) -> """
    Globally and temporarily ignore input from certain nicks when they're spamming
  """

  init: (bot, config) ->
    limiter = rateLimit config.rateLimit

    bot.use "message", (from, to, text, message, next) ->
      limiter from, go: () ->
        next from, to, text, message, next

