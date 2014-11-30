request = require "request"
rateLimit = require "nogo"
c = require "irc-colors"

module.exports =
  help: (config) -> """
    Convert between crypto-currencies using #{c.underline "http://cryptocoincharts.info"}
    #{c.red "#{config.global.prefix}coin <amount> <source currency ID> to <dest currency ID>"}: Convert between trading pairs
    #{c.red "#{config.global.prefix}coin-list"}: List trading currency IDs
  """

  init: (bot, config) ->
    prefix = config.global.prefix

    limiter = rateLimit
      rate: 0.7
      strikes: 5
      cooldown: 10

    bot.any ///^#{prefix}coin-list$///i, (from, to) ->
      limiter nick,
        no: (strikes) -> if strikes == 1 then bot.reply from, to, "trading level = TOO INTENSE"
        go: () -> request.get "http://api.cryptocoincharts.info/listCoins", (error, response, body) ->
          if error then throw error
          list = JSON.parse body
          bot.reply from, to, ("#{coin.id} (#{coin.name})" for coin in list).join ", "

    bot.any ///^#{prefix}coin\s+(\d+)\s+(\w+)\s+to\s+(\w+)$///i, (from, to, match) ->
      limiter nick,
        no: (strikes) -> if strikes == 1 then bot.reply from, to, "trading level = TOO INTENSE"
        go: () ->
          value = Number match[1]
          source = match[2]
          dest = match[3]

          # using public API documented at: http://www.cryptocoincharts.info/v2/tools/api
          request.get "http://api.cryptocoincharts.info/tradingPair/#{source}_#{dest}", (error, response, body) ->
            if error then throw error

            # if we requested a valid trading pair
            pair = JSON.parse body
            if pair.id
              bot.reply from, to, "#{value} #{pair.coin1 || source} = #{pair.price * value} #{pair.coin2 || dest}, best market: #{pair.best_market}"
            else
              bot.reply from, to, "No exchange information available for #{source} to #{dest}. Try a more popular trading pair"
