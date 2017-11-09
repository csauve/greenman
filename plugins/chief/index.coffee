CSON = require "cson"
c = require "irc-colors"
rateLimit = require "nogo"
path = require "path"

MESSAGE_CHANCE = 1 / 1000

masterchief = CSON.parseFile path.join __dirname, "masterchief.cson"
cortana = CSON.parseFile path.join __dirname, "cortana.cson"
arbiter = CSON.parseFile path.join __dirname, "arbiter.cson"
johnson = CSON.parseFile path.join __dirname, "johnson.cson"
spark = CSON.parseFile path.join __dirname, "spark.cson"

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

  help: (config) -> """
    Randomly posts masterchief quotes, or provides them on demand:
    #{c.red "#{config.global.prefix}chief"}
    #{c.red "#{config.global.prefix}cortana"}
    #{c.red "#{config.global.prefix}arbiter"}
    #{c.red "#{config.global.prefix}johnson"}
    #{c.red "#{config.global.prefix}spark"}
  """

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

    bot.msg ///^#{prefix}johnson$///, (nick, channel) ->
      quote = getRandomQuote(johnson)
      bot.reply nick, channel, c.brown quote

    bot.msg ///^#{prefix}spark$///, (nick, channel) ->
      quote = getRandomQuote(spark)
      bot.reply nick, channel, c.aqua quote

    bot.msg (nick, channel) ->
      if Math.random() >= MESSAGE_CHANCE then return
      randomLimiter channel, go: () ->
        quote = getRandomQuote(masterchief)
        bot.say channel, c.green quote
