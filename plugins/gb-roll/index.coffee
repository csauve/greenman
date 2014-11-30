Roll = require "roll"
roll = new Roll()
c = require "irc-colors"

module.exports =
  help: (config) ->
    "#{c.red "#{config.global.prefix}roll <dice>"}: Roll <dice> like #{c.teal 'd20'}, #{c.teal '2d6+1'}, #{c.teal '5'}"

  init: (bot, config, modules) ->
    bot.any ///^#{config.global.prefix}roll\s+(.+)$///i, (from, to, match) ->
      input = match[1]

      if /^\d+$/.test input
        sides = Number input
        if sides > 1
          input = "d#{input}"
          result = roll.roll(input).result
          bot.reply from, to, "A #{result} shows on the #{sides}-sided die"
          return

      if roll.validate input
        result = roll.roll(input).result
        bot.reply from, to, result
      else
        bot.reply from, to, "Bad format. See #{c.underline "https://github.com/troygoode/node-roll"} for some valid formats"