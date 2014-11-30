request = require "request"
rateLimit = require "nogo"
c = require "irc-colors"

MAX_LIST_SIZE = 15

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
      limiter from,
        no: (strikes) -> if strikes == 1 then bot.reply from, to, "trading level = TOO INTENSE"
        go: () -> request.get "http://api.cryptocoincharts.info/listCoins", (error, response, body) ->
          if error then throw error
          list = JSON.parse body
          list = list.sort (a, b) -> Number b.volume_btc - Number a.volume_btc
          topList = ("#{c.teal coin.id} (#{coin.name})" for coin in list[...MAX_LIST_SIZE]).join ", "
          bot.reply from, to, "#{c.underline "cryptocoincharts.info"} lists #{c.red list.length} currencies. Here are the top #{c.red MAX_LIST_SIZE} by BTC volume: #{topList}"

    bot.any ///^#{prefix}coin\s+(\d+)\s+(\w+)\s+to\s+(\w+)$///i, (from, to, match) ->
      limiter from,
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
              bot.reply from, to, "#{value} #{pair.coin1 || source} = #{c.red (pair.price * value)} #{pair.coin2 || dest}, best market: #{pair.best_market}"
            else
              bot.reply from, to, "No exchange information available for #{source} to #{dest}. Try a more popular trading pair"
