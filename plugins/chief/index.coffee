CSON = require "cson"
c = require "irc-colors"
rateLimit = require "nogo"
path = require "path"

QUOTES_FILE = path.join __dirname, "masterchief.cson"
MESSAGE_CHANCE = 1 / 1000

masterchief = CSON.parseFile QUOTES_FILE

commandLimiter = rateLimit
  rate: 0.3
  strikes: 3
  cooldown: 10

day = 60 * 60 * 24
randomLimiter = rateLimit
  rate: 1 / day
  burst: 2
  strikes: 2
  cooldown: 2 * day

getRandomQuote = () ->
  index = Math.floor(masterchief.quotes.length * Math.random())
  return masterchief.quotes[index]

module.exports =
  help: (config) ->
    "Randomly posts masterchief quotes. Can be asked directly, too: #{c.red "#{config.global.prefix}chief"}"

  init: (bot, config, modules) ->
    prefix = config.global.prefix

    bot.msg ///^#{prefix}chief$///, (nick, channel) ->
      commandLimiter nick,
        no: (strike) -> if strike == 1 then bot.say nick, "Save it for the covenant!"
        go: () ->
          quote = getRandomQuote()
          bot.reply nick, channel, c.green quote

    bot.msg (nick, channel) ->
      if Math.random() >= MESSAGE_CHANCE then return
      randomLimiter channel, go: () ->
        quote = getRandomQuote()
        bot.say channel, c.green quote
