AWS = require "aws-sdk"
path = require "path"

module.exports =
  store: (awsConfig, storageConfig, mp3Buffer, filename, cb) ->
    s3 = new AWS.S3(awsConfig)
    key = path.join storageConfig.folder, filename
    params =
      Body: mp3Buffer
      Bucket: storageConfig.bucket
      Key: key
    s3.putObject params, (err, data) ->
      if err then return cb err
      cb null, storageConfig.publicUrlBase + key
