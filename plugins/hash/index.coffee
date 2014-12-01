c = require "irc-colors"
crypto = require "crypto"
rateLimit = require "nogo"

ALG_PER_MSG = 20

limiter = rateLimit
  rate: 0.5

module.exports =
  help: (config) ->
    algs = crypto.getHashes()
    # workaround for message parts being missed by gamesurge when chunked
    chunks = []
    for i in [0..algs.length - 1]
      if i % ALG_PER_MSG == 0
        chunks.push []
      chunks[chunks.length - 1].push algs[i]
    """
    #{c.red "#{config.global.prefix}hash <algorithm> <text>"}: Hash text with one of the supported algorithms:
    #{(c.teal chunk.join ", " for chunk in chunks).join "\n"}
    """

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
