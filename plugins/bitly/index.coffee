url = require "url"
c = require "irc-colors"
rateLimit = require "nogo"
BitlyAPI = require "node-bitlyapi"

REQUEST_PREFIX = "https://api-ssl.bitly.com/v3/shorten?domain=j.mp&format=txt&longUrl="
accessToken = null

limiter = rateLimit
  rate: 1 / 5
  burst: 2
  strikes: 3
  timeout: 120

Bitly = new BitlyAPI {}

module.exports =
  help: (config) ->
    "#{c.red "#{config.global.prefix}shorten <url>"}: Shorten links with bitly"

  shorten: (longUrl, callback) ->
	  if !longUrl.match /^https?:\/\/.+/i
      longUrl = "http://#{longUrl}"
    
    params =
      longUrl: longUrl
      format: "txt"
      domain: "j.mp"

    Bitly.shorten params, (error, result) ->
      callback error, result?.trim()

  init: (bot, config) ->
    prefix = config.global.prefix

    accessToken = config.bitly?.accessToken
    if !accessToken
      throw new Error "bitly.accessToken was not configured"

    Bitly.setAccessToken accessToken

    bot.any ///^#{prefix}shorten\s+(.+)$///i, (from, to, match) ->
      limiter from,
        no: (strike) ->
          if strike == 1 then bot.reply from, to, "Please limit your request rate"
        go: () ->
          module.exports.shorten match[1], (error, short) ->
            throw error if error
            bot.reply from, to, c.underline.red short
