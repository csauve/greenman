FFmpeg = require "fluent-ffmpeg"
request = require "request"
ytdl = require "ytdl-core"
FFmpeg = require "fluent-ffmpeg"
sanitizeFilename = require "sanitize-filename"
path = require "path"

module.exports =
  # returns true if this downloader can handle the given URL
  canDownload: (url) ->
    /youtube\.com/i.test url

  # given a URL, calls back with `error`, `metadata`, and `mp3Buffer`
  getMedia: (url, opts, callback) ->
    ytdl.getInfo url, {downloadUrl: true}, (err, info) ->
      if err then return callback err

      nameMatch = info.title?.match /(.+)\s+-\s+(.+)/i
      meta =
        artist: nameMatch?[1]
        title: nameMatch?[2]
        artUrl: "http://img.youtube.com/vi/#{info.vid}/maxresdefault.jpg"

      # reject videos that are too long
      if opts.maxLengthSeconds && info.length_seconds > opts.maxLengthSeconds
        return callback new Error("The video is too long. The configured maximum length is #{opts.maxLengthSeconds}s")

      # find best quality mp4 container to download
      hqFormat = findHqFormat info.formats
      if not hqFormat then return callback new Error("Could not find a suitable format. Try another video")

      console.log "Requesting high quality stream from #{hqFormat.url}"
      inputStream = request(hqFormat.url)
      outBuf = new Buffer(0)

      console.log "Encoding mp4 video to mp3 audio"
      command = new FFmpeg(inputStream)
        .audioCodec "libmp3lame"
        .format "mp3"
        .on "error", callback
        .on "end", ->
          console.log "Encoding completed, getting buffer"
          callback null, meta, outBuf

      ffstream = command.pipe()
      ffstream.on "data", (data) ->
        outBuf = Buffer.concat([outBuf, data])

# todo: use ytdl-core to use any supported format
findHqFormat = (formats) ->
  quality = 0
  fmt = null
  for format in formats when format.container == "mp4" and format.type.indexOf("video/mp4") == 0 and not format.s
    if format.audioBitrate > quality
      quality = format.audioBitrate
      fmt = format
  fmt