url = require "url"
c = require "irc-colors"
BitlyAPI = require "node-bitlyapi"

REQUEST_PREFIX = "https://api-ssl.bitly.com/v3/shorten?domain=j.mp&format=txt&longUrl="
Bitly = new BitlyAPI {}

shorten = (longUrl, callback) ->
  if !longUrl.match /^https?:\/\/.+/i
    longUrl = "http://#{longUrl}"
  params =
    longUrl: longUrl.trim()
    format: "txt"
    domain: "j.mp"
  Bitly.shorten params, (error, result) ->
    callback error, result?.trim()


module.exports =
  name: "bitly"

  help: (config) ->
    "#{c.red "#{config.global.prefix}shorten <url>"}: Shorten links with bitly"

  init: (bot, config) ->
    accessToken = config.bitly?.accessToken
    if !accessToken then throw new Error "bitly.accessToken was not configured"
    Bitly.setAccessToken accessToken

    bot.any ///^#{config.global.prefix}shorten\s+(.+)$///i, (from, to, match) ->
      shorten match[1], (error, short) ->
        throw error if error
        bot.reply from, to, c.underline.red short
