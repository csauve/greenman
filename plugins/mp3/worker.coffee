graphicsMagick = require "gm"
sanitizeFilename = require "sanitize-filename"
ID3Writer = require "browser-id3-writer"
_ = require "lodash"
request = require "request"
uuid = require "uuid/v4"

downloaders =
  youtube: require "./downloaders/youtube"

s3Storage = require "./storage/s3"

metadataKeys = ["artist", "title", "year", "genre", "album", "artUrl"]

module.exports =
  supportedMetadata: metadataKeys
  supportedDownloaders: (it for it of downloaders)
  # calls back with `error` and `downloadUrl`
  getMedia: (config, mediaUrl, argMetadata, callback) ->
    downloader = {mod: mod, name: name} for name, mod of downloaders when mod.canDownload mediaUrl
    if not downloader then return callback new Error("No downloader supports the URL")

    console.log "Using downloader #{downloader.name} for url #{mediaUrl}"
    downloader.mod.getMedia mediaUrl, config.mp3, (err, foundMetadata, mp3Buffer) ->
      if err then return callback err
      metadata = _.defaults argMetadata, foundMetadata

      applyMetaData mp3Buffer, metadata, (err, mp3Buffer) ->
        if err then return callback err
        filename = "#{uuid()}.mp3"
        if metadata?.artist and metadata?.title
          filename = sanitizeFilename "#{metadata.artist} - #{metadata.title}.mp3"

        console.log "Uploading file #{filename} to S3"
        s3Storage.store config.global.aws, config.mp3.s3Storage, mp3Buffer, filename, callback


applyMetaData = (mp3Buffer, metadata, callback) ->
  metadata = _.pick metadata, (val, key, o) -> val and key in metadataKeys
  if _.isEmpty metadata
    console.log "No metadata to apply"
    return callback null, mp3Buffer

  console.log "Applying metadata to MP3 buffer: #{JSON.stringify(metadata)}"
  getArt metadata.artUrl, (err, artBuffer) ->
    id3 = new ID3Writer(new Uint8Array(mp3Buffer).buffer)
    #setFrame TLEN
    if metadata.artist then id3.setFrame "TPE1", [metadata.artist]
    if metadata.title then id3.setFrame "TIT2", metadata.title
    if metadata.year then id3.setFrame "TYER", metadata.year
    if metadata.genre then id3.setFrame "TCON", [metadata.genre]
    if metadata.album then id3.setFrame "TALB", metadata.album
    if artBuffer
      console.log "Applying cover pic metadata"
      id3.setFrame "APIC",
        type: 3
        data: new Uint8Array(artBuffer).buffer
        description: ""
    id3.addTag()
    callback null, Buffer.from(id3.arrayBuffer)

getArt = (artUrl, callback) ->
  if not artUrl then return callback()
  console.log "Getting art from URL #{artUrl}"
  downloadStream = request artUrl
  downloadStream.on "error", callback
  graphicsMagick downloadStream, "cover.jpg"
    .resize 500, 500, "^"
    .gravity "Center"
    .crop 500, 500, 0, 0
    .toBuffer "JPG", callback
