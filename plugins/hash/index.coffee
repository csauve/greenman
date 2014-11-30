c = require "irc-colors"
crypto = require "crypto"
rateLimit = require "nogo"

limiter = rateLimit
  rate: 0.5

module.exports =
  help: (config) ->
    "#{c.red "#{prefix}hash <algorithm> <text>"}: Hash text with one of the supported algorithms: #{crypto.getHashes().join ","}"

  init: (bot, config) ->
    prefix = config.global.prefix

    bot.any ///^#{prefix}hash\s+(.+)\s+(.+)$///i, (from, to, match) ->
      limiter from,
        go: () ->
          try
            hash = crypto.createHash(match[1]).update(match[2]).digest "hex"
            bot.reply from, to, hash
          catch error
            bot.reply from, to, "Failed to hash: #{error}"
