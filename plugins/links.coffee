c = require "irc-colors"
getTitleAtUrl = require "url-to-title"
getUrls = require "get-urls"
normalizeUrl = require "normalize-url"
async = require "async"
BitlyAPI = require "node-bitlyapi"

channelLastUrls = {}
Bitly = new BitlyAPI {}

shorten = (longUrl, callback) ->
  params =
    longUrl: normalizeUrl(longUrl).trim()
    format: "txt"
    domain: "j.mp"
  Bitly.shorten params, (error, result) ->
    callback error, result?.trim()

getFormattedTitle = (url, cb) ->
  getTitleAtUrl url, (err, title) ->
    cb if title then c.teal "\"#{title}\"" else null

module.exports =
  getFormattedTitle: getFormattedTitle

  name: "links"

  help: (config) -> """
    Posts titles for links pasted in the channel, and can shorten URLs:
    #{c.red "#{config.global.prefix}shorten <url> [<url>...]"}: Shorten the given URL(s)
    #{c.red "#{config.global.prefix}shorten"}: Shorten the last URL posted to this channel (excluding ignored users)
  """

  init: (bot, config, modules) ->
    accessToken = config.bitly?.accessToken
    if !accessToken then throw new Error "bitly.accessToken was not configured"
    Bitly.setAccessToken accessToken

    bot.msg ///^#{config.global.prefix}shorten(?:\s+(.+))?///i, (nick, channel, match) ->
      urls = if match[1]
        Array.from getUrls match[1]
      else if channelLastUrls[channel]
        [channelLastUrls[channel]]
      else
        []

      if urls.length == 0
        bot.reply nick, channel, "I couldn't find a URL to shorten"
      else for url in urls
        shorten url, (err, short) ->
          if short then bot.reply nick, channel, c.underline short

    bot.msg (nick, channel, text) ->
      urls = getUrls text
      urls.forEach (url) ->
        channelLastUrls[channel] = url
        getFormattedTitle url, (title) ->
          if title then bot.say channel, title
