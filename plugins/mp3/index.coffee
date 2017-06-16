ytdl = require "ytdl-core"
c = require "irc-colors"
rateLimit = require "nogo"
fs = require "fs"
mediaWorker = require "./worker"
CSON = require "cson"

module.exports =
  name: "mp3"

  help: (config) -> """
    Converts media at a URL into an mp3 file, with metadata scraping
    #{c.red "#{config.global.prefix}mp3 <url> [metadata CSON]"}
    Supported metadata: #{c.teal mediaWorker.supportedMetadata.join ", "}
    Supported downloaders: #{c.teal mediaWorker.supportedDownloaders.join ", "}
  """

  init: (bot, config) ->
    limiter = rateLimit
      rate: config.mp3.tokenRefillRate
      burst: 1

    bot.msg ///#{config.global.prefix}mp3\s+(\S+)(?:\s+(.+))?///, (nick, channel, match) ->
      limiter nick,
        no: -> bot.reply nick, channel, "Ask me later, I'm busy (- ‿ - ✿)"
        go: ->
          mediaUrl = match[1]
          metaCSON = match[2]

          metaParams = if metaCSON then CSON.parse metaCSON else {}
          if metaParams instanceof Error
            bot.reply nick, channel, "Your metadata params should be valid CSON, like: #{c.teal "title: 'Sandstorm', artist: 'Darude'"}"
            return

          bot.reply nick, channel, "Hang on, I'll convert that for you..."
          mediaWorker.getMedia config, mediaUrl, metaParams, (err, downloadUrl) ->
            if err then return bot.reply nick, channel, "#{c.red "AAAA CAN'T DO IT"}: #{c.teal err.message}"
            downloadUrl = downloadUrl.split(" ").join("%20")
            bot.reply nick, channel, "Done: #{c.underline.red downloadUrl}"

