c = require "irc-colors"
getTitleAtUrl = require "get-title-at-url"
getUrls = require "get-urls"
async = require "async"
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

expandLink = (url, cb) ->
  jobs =
    shorten: (cb) -> shorten url, (err, short) -> cb null, short
    title: (cb) -> getTitleAtUrl url, (title, err) -> cb null, title
  async.parallel jobs, (err, results) ->
    title = results.title
    short = results.shorten
    if title || short
      cb "#{if title then c.teal "\"#{title}\"" else ""}#{if short then c.underline short else ""}"
    else
      cb null

module.exports =
  expandLink: expandLink

  name: "titles"

  help: (config) ->
    "Gets titles for and shortens links posted in the channel"

  init: (bot, config, modules) ->
    accessToken = config.bitly?.accessToken
    if !accessToken then throw new Error "bitly.accessToken was not configured"
    Bitly.setAccessToken accessToken

    bot.msg (nick, channel, text) ->
      urls = getUrls text
      urls.forEach (url) ->
        expandLink url, (reply) ->
          if reply then bot.say channel, reply
