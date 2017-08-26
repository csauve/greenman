c = require "irc-colors"
crypto = require "crypto"

ALG_PER_MSG = 20

module.exports =
  name: "hash"

  help: (config) ->
    algs = crypto.getHashes()
    # workaround for message parts being missed by gamesurge when chunked
    chunks = []
    for i in [0..algs.length - 1]
      if i % ALG_PER_MSG == 0
        chunks.push []
      chunks[chunks.length - 1].push algs[i]
    """
    #{c.red "#{config.global.prefix}hash <algorithm> <text>"}: Outputs the hash of the given text, excluding leading spaces
    Supported algorithms: #{(c.teal chunk.join ", " for chunk in chunks).join "\n"}
    """

  init: (bot, config) ->
    prefix = config.global.prefix

    bot.any ///^#{prefix}hash\s+(\w+)\s+(.+)$///i, (from, to, match) ->
      try
        hash = crypto.createHash(match[1]).update(match[2]).digest "hex"
        bot.reply from, to, c.red hash
      catch error
        bot.reply from, to, "Failed to hash: #{error}"
