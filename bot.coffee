greenman = require "greenman"
CSON = require "cson"
c = require "irc-colors"

config = CSON.parseFile "./config.cson"
prefix = config.global.prefix
bot = new greenman.Bot config.bot.nick
plugins = require "./plugins"
helpPages = {}

console.log "Initializing #{plugins.length} plugins"
for plugin in plugins
  if plugin.help and plugin.name then helpPages[plugin.name] = plugin.help config
  plugin.init bot, config

bot.any ///^#{prefix}help\s+(.+)$///i, (from, to, match) ->
  content = helpPages[match[1]]
  bot.reply from, to, if content then content else "Help not found for \"#{match[1]}\". Try #{c.red "#{prefix}help"} for a list of plugins"

bot.any ///^#{prefix}help$///i, (from, to, match) ->
  results = (page for page of helpPages)
  bot.reply from, to, "Use #{c.red "#{prefix}help <plugin>"} to learn more about these plugins: #{c.teal results.join ", "}"

console.log "Connecting to #{config.bot.server}"
bot.connect config.bot.server, config.bot.options