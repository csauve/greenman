c = require "irc-colors"
express = require "express"
serveStatic = require "serve-static"
http = require "http"
sio = require "socket.io"
fs = require "fs"
hb = require "handlebars"

template = hb.compile fs.readFileSync __dirname + "/static/index.html", "utf8"

setupServer = (config) ->
  app = express()
  server = http.createServer app
  io = sio server

  app.use "/audio", serveStatic(config.audioDir or "/tmp")
  app.use "/static", serveStatic(__dirname + "/static")
  app.get "/", (req, res) ->
    res.send template publicUrl: config.publicUrl

  port = config.localPort or 8902
  server.listen port
  console.log "TTS app served at " + port

  return io


module.exports =
  help: (config) ->
    "Visit #{c.red "#{config.talk.publicUrl}"} for live playback of the channel"

  init: (bot, config) ->
    io = setupServer config.talk

    bot.msg (nick, channel, text) ->
      io.clients (err, clients) ->
        if not err and clients.length > 0
          io.emit "audio", {nick: nick, text: text}


