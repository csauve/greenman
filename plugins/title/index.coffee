request = require "request"
c = require "irc-colors"
async = require "async"
Entities = require("html-entities").XmlEntities

entities = new Entities()

TITLE_REGEX = /(<\s*title[^>]*>(.+?)<\s*\/\s*title)>/g

module.exports =
  help: (config) ->
    "Provides page titles for other plugins and for URLs posted in the channel if #{c.teal title.enableAutoTitle} is configured"

  resolve: (url, callback) ->
    request.get url, (error, response, body) ->
      if error then return callback error
      if response.statusCode != 200 then return callback new Error "Response not OK"

      TITLE_REGEX.lastIndex = 0
      match = TITLE_REGEX.exec body
      if match
        decoded = entities.decode match[2]
        callback null, decoded
      else
        callback new Error "No <title> tags found"

  init: (bot, config) ->
    enableAutoTitle = config.title?.enableAutoTitle
    if !enableAutoTitle then return

    bot.msg /(?:.*\s+|^)((http:\/\/|https:\/\/|www\.)(\S)+)(?:\s+.*|$)/i, (nick, channel, match) ->
      url = match[1]

      tasks =
        title: (callback) ->
          module.exports.resolve url, callback
        short: (callback) ->
          if modules.bitly
            return modules.bitly.shorten url, callback
          callback null, null

      async.parallel tasks, (err, results) ->
        throw err if err
        if results.short
          bot.say channel, "[ #{c.teal results.title} ] #{c.underline results.short}"
        else
          bot.say channel, "[ #{c.teal results.title} ]"
