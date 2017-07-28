request = require "request"
googleScraper = require "google-search-scraper"
rateLimit = require "nogo"
c = require "irc-colors"
links = require "./links"

firstResultSearch = (term, cb) ->
  counter = 0
  options =
    query: term
    limit: 1
  googleScraper.search options, (err, url) ->
    if counter++ == 0 then cb err, url

module.exports =
  name: "google"

  help: (config) -> """
    #{c.red "#{config.global.prefix}g <query>"}: Gets the first Google result for a query
    #{c.red "#{config.global.prefix}complete <query>"}: Get the top 5 Google auto-complete results
  """

  init: (bot, config) ->
    prefix = config.global.prefix

    limiter = rateLimit
      rate: 0.3
      strikes: 5
      cooldown: 20

    bot.msg ///^#{prefix}g\s+(.+)$///, (nick, channel, match) ->
      limiter nick, go: () ->
        firstResultSearch match[1], (err, url) ->
          if err
            console.error err
            bot.reply nick, channel, c.red "(●´⌓`●) s-s-sorry #{nick}-san, I have failed you... please forgive me"
          else
            links.getFormattedTitle url, (title) ->
              bot.reply nick, channel, "#{if title then "#{title} " else ""}#{c.underline url}"

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
