const AWS = require("aws-sdk");
const path = require("path");

//TODO: expiry
module.exports = {
  store: (awsConfig, storageConfig, fileBuffer, contentType, filename, cb) => {
    const s3 = new AWS.S3(awsConfig);
    const key = path.join(storageConfig.folder, filename);
    const params = {
      Body: fileBuffer,
      ContentType: contentType,
      Bucket: storageConfig.bucket,
      Key: key,
      ACL: "public-read"
    };
    s3.putObject(params, (err, data) => {
      if (err) return cb(err);
      cb(null, storageConfig.urlBase + key);
    });
  }
};
