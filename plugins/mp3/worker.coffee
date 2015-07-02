fs = require "fs"
graphicsMagick = require "gm"
sanitizeFilename = require "sanitize-filename"
id3 = require "id3-writer"
path = require "path"
findRemoveSync = require "find-remove"
_ = require "underscore"
md5 = require "MD5"
request = require "request"

downloaders =
  youtube: require "./downloaders/youtube"

module.exports =
  downloaderList: ->
    it for it of downloaders

  scheduleCleanups: (directory, expirySeconds) ->
    cleanup = ->
      findRemoveSync directory, {age: {seconds: expirySeconds}}
    setInterval cleanup, 60000

  # calls back with `error` and `filename`
  getMedia: (url, metaArgs, config, callback) ->
    downloader = mod for name, mod of downloaders when mod.canDownload url
    if not downloader then return callback new Error "No downloader supports URL #{url}"

    downloader.getMedia url, config, (err, foundMeta, mp3FilePath) ->
      if err then return callback err

      # build finalized metadata
      metaResult = _.defaults metaArgs, foundMeta
      nameMatch = metaResult.name?.match /(.+)\s+-\s+(.+)/i
      metaResult.artist ||= nameMatch?[1]
      metaResult.title ||= nameMatch?[2]
      metaResult.name ||= md5 Math.random()

      # final desired filename for the mp3 file
      filename = sanitizeFilename metaResult.name

      renameAndComplete = (err) ->
        if err then return callback err
        fs.renameSync mp3FilePath, "#{path.join config.mediaDir, filename}.mp3"
        callback null, filename

      if metaResult.artUrl
        artPath = "#{path.join config.mediaDir, filename}.jpg"
        downloadAndResizeCover metaResult.artUrl, artPath, (err) ->
          if err then return callback err
          applyMetaData mp3FilePath, metaResult, artPath, renameAndComplete
      else
        applyMetaData mp3FilePath, metaResult, null, renameAndComplete

downloadAndResizeCover = (artUrl, destFile, cb) ->
  downloadStream = request artUrl
  writeStream = fs.createWriteStream destFile
  graphicsMagick downloadStream, destFile
    .resize 500, 500, "^"
    .gravity "Center"
    .crop 500, 500, 0, 0
    .stream()
    .pipe writeStream
  writeStream.on "error", cb
  downloadStream.on "error", cb
  writeStream.on "finish", -> cb()

applyMetaData = (mp3FilePath, metadata, artPath, callback) ->
  metaCopy = _.pick metadata, (val, key, o) -> val and key in ["artist", "title", "year", "genre", "album"]
  id3Meta = new id3.Meta(metaCopy, (if artPath then [new id3.Image(artPath)] else null))
  new id3.Writer().setFile(new id3.File(mp3FilePath)).write id3Meta, (err) ->
    callback err
