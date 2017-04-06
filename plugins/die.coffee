c = require "irc-colors"

module.exports =
  name: "die"

  help: (config) ->
    "#{c.red "#{config.global.prefix}die"}: Shutdown the bot. ECS will restart it using the latest build from ECR"

  init: (bot, config) ->
    bot.msg ///^#{config.global.prefix}die///i, (nick, channel) ->
      process.exit()
