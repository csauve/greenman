c = require "irc-colors"

pages = {}

storeHelp = (pageName, content) ->
  pages[pageName] = content

module.exports =
  help: (config) -> """
    #{c.red "#{config.global.prefix}help"}: List plugins with help available
    #{c.red "#{config.global.prefix}help <plugin>"}: Show help for a plugin
    #{c.red "#{config.global.prefix}help-search <regex>"}: Search through help pages by regular expression
  """

  init: (bot, config, plugins) ->
    prefix = config.global.prefix

    for pluginName, plugin of plugins
      if plugin.help then storeHelp pluginName, plugin.help config

    bot.any ///^#{prefix}help\s+(.+)$///i, (from, to, match) ->
      content = pages[match[1]]
      bot.reply from, to, if content then content else "Help not found for \"#{match[1]}\". List plugins with #{prefix}help"

    bot.any ///^#{prefix}help-search\s+(.+)$///i, (from, to, match) ->
      matches = (s) ->
        regex = new RegExp match[1], "i"
        return regex.test s

      results = (page for page, content of pages when matches(page) or matches(content))
      if results.length
        bot.reply from, to, "These plugins match #{c.teal match[1]}: #{results.join ", "}"
      else
        bot.reply from, to, "No results found for #{c.teal match[1]}"

    bot.any ///^#{prefix}prefix$///i, (from, to, match) ->
      results = (page for page of pages)
      bot.reply from, to, "Use #{c.red "#{prefix}help <plugin>"} to learn more about these plugins: #{c.teal results.join ", "}"