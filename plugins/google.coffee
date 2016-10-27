request = require "request"
rateLimit = require "nogo"
c = require "irc-colors"

module.exports =
  name: "google"

  help: (config) -> """
    #{c.red "#{config.global.prefix}g <query>"}: Gets the first Google result for a query
    #{c.red "#{config.global.prefix}complete <query>"}: Get the top 5 Google auto-complete results
  """

  init: (bot, config, plugins) ->
    prefix = config.global.prefix

    limiter = rateLimit
      rate: 0.3
      strikes: 5
      cooldown: 20

    bot.msg ///^#{prefix}g\s+(.+)$///, (nick, channel, match) ->
      limiter nick, go: () ->
        query = match[1]
        request.get "http://www.google.com/search?q=#{query}&btnI", (error, response, body) ->
          if error then throw error
          url = response.request.href

          # try to get the title
          if plugins.title
            plugins.title.resolve url, (error, title) ->
              if !error and title
                bot.reply nick, channel, "#{c.underline.red url} [ #{c.teal title} ]"
          else
            bot.reply nick, channel, c.underline.red url

    bot.msg ///^#{prefix}complete\s+(.+)$///, (nick, channel, match) ->
      limiter nick, go: () ->
        query = match[1]
        request.get "http://suggestqueries.google.com/complete/search?client=firefox&q=#{query}", (error, response, body) ->
          if error then throw error
          result = JSON.parse body
          if !result or !result[1] or result[1].length == 0
            return bot.reply nick, channel, "No suggestions found"

          top5 = result[1].slice 0, 5
          top5 = top5.map (suggestion) -> "\"#{query}#{c.teal suggestion[query.length..]}\""
          bot.reply nick, channel, top5.join ", "
