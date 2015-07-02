ytdl = require "ytdl-core"
soundrain = require "soundrain"
c = require "irc-colors"
rateLimit = require "nogo"
fs = require "fs"
mediaWorker = require "./worker"
path = require "path"
CSON = require "cson"

module.exports =
  help: (config) -> """
    #{c.red "#{config.global.prefix}mp3 <url> [metadata]"}: Converts the online media into an mp3 file with metadata and album art if available. Metadadata can be supplied manually by CSON argument. Supported downloaders are: #{c.teal mediaWorker.downloaderList().join ", "}
  """

  init: (bot, config) ->
    limiter = rateLimit
      rate: config.mp3.tokenRefillRate
      burst: 1

    mediaWorker.scheduleCleanups config.mp3.mediaDir, config.mp3.expirySeconds

    bot.msg ///#{config.global.prefix}mp3\s+(\S+)(?:\s+(.+))?///, (nick, channel, match) ->
      limiter nick,
        no: -> bot.reply nick, channel, "Ask me later, I'm busy (◡ ‿ ◡ ✿)"
        go: ->
          metaParams = if match[2] then CSON.parse match[2] else {}
          if metaParams instanceof Error
            bot.reply nick, channel, "Your metadata params should be valid CSON, like: #{c.teal "title: 'Sandstorm', artist: 'Darude'"}"
            return

          bot.reply nick, channel, "Hang on, I'll convert that for you..."
          mediaWorker.getMedia match[1], metaParams, config.mp3, (err, filename) ->
            if err then return bot.reply nick, channel, "Failed to fetch media: #{c.red err.message}"
            downloadUrl = "#{path.join config.mp3.baseDownloadUrl, encodeURIComponent(filename)}.mp3"
            bot.reply nick, channel, "Conversion complete: #{c.underline.red downloadUrl}"

