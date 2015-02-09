c = require "irc-colors"
request = require "request"
xml2js = require "xml2js"
rateLimit = require "nogo"

module.exports =
  help: (config) ->
    "#{c.red "#{config.global.prefix}wa <query>"}: Returns Wolfram Alpha results"

  init: (bot, config) ->
    limiter = rateLimit {rate: 0.3, strikes: 5, cooldown: 20}

    bot.any ///^#{config.global.prefix}wa\s+(.+)$///i, (from, to, match) ->
      limiter from, go: ->
        url = "http://api.wolframalpha.com/v2/query?appid=#{config.wolfram.appId}&input=#{match[1]}&format=plaintext"

        request.get url, (error, response, body) ->
          if error then throw error

          xml2js.parseString body, (err, response) ->
            if err then return bot.reply from, to, "Couldn't parse response, precious... #{err}"
            result = response.queryresult

            if result.$.success == "true"
              interpretation = result.pod[0].subpod[0].plaintext
              answer = result.pod[1].subpod[0].plaintext[0].split("\n")[0]
              bot.reply from, to, "#{c.teal interpretation}: #{c.red answer}"
            else
              bot.reply from, to, "WA responsed with error#{if result.tips then ":#{result.tips[0].tip[0].$.text}" else ""}"
