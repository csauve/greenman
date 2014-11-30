request = require "request"
rateLimit = require "nogo"
c = require "irc-colors"

QUERY_BASE_URL = "https://api.datamarket.azure.com/Bing/Search/v1/Web?$format=json&Query="

module.exports =
  help: (config) -> """
    #{c.red "#{config.global.prefix}bing <query>"}: Replies with the top Bing search result for your query
  """

  init: (bot, config) ->
    accountKey = config?.bing?.accountKey
    if !accountKey then throw new Error "bing.accountKey was not configured"

    limiter = rateLimit
      rate: 0.3
      strikes: 5
      cooldown: 60

    bot.any ///^#{config.global.prefix}bing\s+(.+)$///i, (from, to, match) ->
      limiter nick,
        no: (strikes) -> if strikes == 1 then bot.reply from, to, "Chill out, bro. Limit bing queries to 0.3 per second"
        go: () ->
          auth = new Buffer [config.bing.accountKey, config.bing.accountKey].join ':'

          request.get
            url: QUERY_BASE_URL + "'" + match[1] + "'"
            headers:
              "Authorization": "Basic " + auth.toString 'base64',
            (error, response, body) ->
              results = JSON.parse(body).d.results
              if results.length == 0
                bot.reply from, to, "No results found!"
              else
                topResult = results[0]
                bot.reply from, to, "#{c.underline.red topResult.Url} [#{topResult.Title}] #{topResult.Description}"
