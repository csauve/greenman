CSON = require "cson"
c = require "irc-colors"
rateLimit = require "nogo"
path = require "path"

CHIEF_FILE = path.join __dirname, "masterchief.cson"
CORTANA_FILE = path.join __dirname, "cortana.cson"
ARBITER_FILE = path.join __dirname, "arbiter.cson"
MESSAGE_CHANCE = 1 / 1000

masterchief = CSON.parseFile CHIEF_FILE
cortana = CSON.parseFile CORTANA_FILE
arbiter = CSON.parseFile ARBITER_FILE

DAY = 60 * 60 * 24
randomLimiter = rateLimit
  rate: 1 / DAY
  burst: 2
  strikes: 2
  cooldown: 2 * DAY

getRandomQuote = (source) ->
  index = Math.floor(source.quotes.length * Math.random())
  return source.quotes[index]

module.exports =
  name: "chief"

  help: (config) ->
    "Randomly posts masterchief quotes, or provides them on demand: #{c.red "#{config.global.prefix}chief"}, #{c.red "#{config.global.prefix}cortana"}, #{c.red "#{config.global.prefix}arbiter"}"

  init: (bot, config) ->
    prefix = config.global.prefix

    bot.msg ///^#{prefix}cortana$///, (nick, channel) ->
      quote = getRandomQuote(cortana)
      bot.reply nick, channel, c.pink quote

    bot.msg ///^#{prefix}arbiter$///, (nick, channel) ->
      quote = getRandomQuote(arbiter)
      bot.reply nick, channel, c.yellow quote

    bot.msg ///^#{prefix}chief$///, (nick, channel) ->
      quote = getRandomQuote(masterchief)
      bot.reply nick, channel, c.green quote

    bot.msg (nick, channel) ->
      if Math.random() >= MESSAGE_CHANCE then return
      randomLimiter channel, go: () ->
        quote = getRandomQuote(masterchief)
        bot.say channel, c.green quote
