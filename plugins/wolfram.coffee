c = require "irc-colors"
request = require "request"
xml2js = require "xml2js"
rateLimit = require "nogo"

limiter = rateLimit {rate: 0.3, strikes: 5, cooldown: 20}

module.exports =
  name: "wolfram"

  help: (config) ->
    "#{c.red "#{config.global.prefix}wa <query>"}: Returns Wolfram Alpha results"

  init: (bot, config) ->
    bot.any ///^#{config.global.prefix}wa\s+(.+)$///i, (from, to, match) ->
      limiter from, go: ->
        query = encodeURIComponent(match[1])
        url = "http://api.wolframalpha.com/v2/query?appid=#{config.wolfram.appId}&input=#{query}&format=plaintext"

        request.get url, (error, response, body) ->
          if error then throw error

          xml2js.parseString body, (err, response) ->
            if err then return bot.reply from, to, "Couldn't parse response, precious... #{err}"
            result = response.queryresult

            if result.$.success == "true"
              interpretation = result.pod[0].subpod[0].plaintext[0].split("\n").join(" ")
              answerLines = result.pod[1].subpod[0].plaintext[0].split("\n")
              if answerLines.length == 1
                bot.reply from, to, "#{c.teal interpretation}: #{c.red answerLines[0]}"
              else
                bot.reply from, to, "#{c.teal interpretation}:"
                for answerLine in answerLines
                  bot.say to, "#{c.red answerLine}"
            else
              bot.reply from, to, "WA responsed with error#{if result.tips then ":#{result.tips[0].tip[0].$.text}" else ""}"
