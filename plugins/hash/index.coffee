c = require "irc-colors"
crypto = require "crypto"
rateLimit = require "nogo"

limiter = rateLimit
  rate: 0.5

module.exports =
  help: (config) ->
    algorithms = crypto.getHashes().join ", "
    "#{c.red "#{config.global.prefix}hash <algorithm> <text>"}: Hash text with one of the supported algorithms: #{algorithms}"

  init: (bot, config) ->
    prefix = config.global.prefix

    bot.any ///^#{prefix}hash\s+(\w+)\s+(.+)$///i, (from, to, match) ->
      limiter from,
        go: () ->
          try
            hash = crypto.createHash(match[1]).update(match[2]).digest "hex"
            bot.reply from, to, c.red hash
          catch error
            bot.reply from, to, "Failed to hash: #{error}"
