FFmpeg = require "fluent-ffmpeg"
request = require "request"
fs = require "fs"
ytdl = require "ytdl-core"
FFmpeg = require "fluent-ffmpeg"
sanitizeFilename = require "sanitize-filename"
path = require "path"

module.exports =
  # returns true if this downloader can handle the given URL
  canDownload: (url) ->
    /youtube\.com/i.test url

  # given a URL, calls back with `error`, `metadata`, and `filename`
  getMedia: (url, opts, callback) ->
    ytdl.getInfo url, {downloadUrl: true}, (err, info) ->
      if err then return callback err

      filePath = path.join opts.mediaDir, sanitizeFilename(info.title)
      meta =
        name: info.title
        artUrl: info.iurlmaxres or info.iurlsd or info.iurlhq or info.iurlmq or info.iurl

      # reject videos that are too long
      if info.length_seconds > opts.maxLengthSeconds
        return callback new Error("The video is too long. The configured maximum length is #{opts.maxLengthSeconds}s")

      # find best quality mp4 container to download
      hqFormat = findHqFormat info.formats
      if not hqFormat then return callback new Error("Could not find a suitable format. Try another video")

      writeStream = fs.createWriteStream "#{filePath}.mp4"
      request(hqFormat.url).pipe writeStream

      writeStream.on "error", callback
      writeStream.on "finish", ->
        new FFmpeg("#{filePath}.mp4")
          .audioCodec "libmp3lame"
          .format "mp3"
          .on "error", callback
          .on "end", ->
            callback null, meta, "#{filePath}.mp3"
          .save "#{filePath}.mp3"


findHqFormat = (formats) ->
  quality = 0
  fmt = null
  for format in formats when format.container == "mp4" and format.type.indexOf("video/mp4") == 0 and not format.s
    if format.audioBitrate > quality
      quality = format.audioBitrate
      fmt = format
  fmt