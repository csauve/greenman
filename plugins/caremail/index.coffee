c = require "irc-colors"
Datastore = require "nedb"
moment = require "moment"

module.exports =
  help: (config) -> """
    #{c.red "#{config.global.prefix}tell <recipient> <message>"}: The message will be delivered immediately when #{c.teal "recipient"} next speaks in this channel
    #{c.red "#{config.global.prefix}in <duration> tell <recipient> <message>"}: Message delivery will be delayed by #{c.teal "duration"}
    #{c.red "#{config.global.prefix}at <date> tell <recipient> <message>"}: The message will be delivered at #{c.teal "date"} in this channel
    #{c.red "#{config.global.prefix}on <date> tell <recipient> <message>"}: Alias for #{c.red "!at"}
    Example #{c.teal "duration"} (<n> <unit>): 1 second; 7 minutes; 2 hours
    Example #{c.teal "date"}: 05-06-2016; 2013-02-08T09; Sun Feb 08 2015 23:09:50 GMT-0800 (PST)
  """


  init: (bot, config, plugins) ->
    prefix = config.global.prefix
    db = new Datastore
      filename: config.caremail.dbPath
      autoload: true

    recall = (context, recipient, cb) ->
      query =
        recipient: recipient
        context: context
        deliver: {$lt: new Date().getTime()}
      db.find query, cb

    remember = (mail, cb) ->
      now = new Date().getTime()
      doc =
        from: mail.from
        context: mail.context
        recipient: mail.recipient
        message: mail.message
        created: now
        deliver: mail.deliver || now
      db.insert doc, cb

    forget = (id) ->
      db.remove {_id: id}, {}

    bot.msg ///#{prefix}(?:(in|(?:on|at))\s+(.+)\s+)?tell\s+(\S+)\s+(.+)$///i, (nick, channel, match) ->
      mail =
        from: nick
        context: channel
        recipient: if match[3] == "me" then nick else match[3]
        message: match[4]

      mail.deliver = if match[1] == "in"
        dmatch = match[2].match /(\d+(?:\.\d+)?)\s+(.+)/i
        (moment().add Number(dmatch[1]), dmatch[2]).valueOf()
      else if match[1] == "at" or match[1] == "on"
        moment(match[2]).valueOf()
      else undefined

      remember mail, (err) ->
        if err
          console.error err.stack
          return bot.reply nick, channel, "I dun goofed. Tell #{mail.recipient} yourself"
        response = if mail.recipient == nick
          "I'll let you know"
        else if mail.recipient == "jcap"
          "I'll put that in his malebox"
        else
          "I'll pass that on"
        bot.reply nick, channel, response

    bot.msg (nick, channel) ->
      mailbox = recall channel, nick, (err, mailbox) ->
        if err then return console.error err
        for mail in mailbox
          if mail.created != mail.deliver then continue
          bot.reply nick, channel, "#{c.teal "#{mail.from} (#{moment(mail.created).fromNow()})"}: #{mail.message}"
          forget mail._id


    contextPollers = {}

    bot.event "join", (channel) ->
      if contextPollers[channel] then clearInterval contextPollers[channel]
      contextPollers[channel] = setInterval ->
        query =
          deliver: {$lt: new Date().getTime()}
          context: channel
        db.find query, (err, mailbox) ->
          for mail in mailbox
            if mail.created == mail.deliver then continue
            bot.reply mail.recipient, mail.context, "#{c.teal "#{mail.from} (#{moment(mail.created).fromNow()})"}: #{mail.message}"
            forget mail._id
      , 1000

