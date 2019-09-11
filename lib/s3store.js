const AWS = require("aws-sdk");

//todo: use calmer to save to s3?

class S3Store {
  constructor(awsConfig) {
    this.bucket = awsConfig.bucketName;
    this.s3 = new AWS.S3(awsConfig);
    this.cachedState = {};
  }

  saveState(filename, state, cb) {
    const params = {
      Body: JSON.stringify(state),
      Bucket: this.bucket,
      Key: filename
    };
    this.s3.putObject(params, (err) => {
      if (!err) this.cachedState[filename] = state;
      if (cb) cb(err);
    });
  }

  getState(filename, cb) {
    if (this.cachedState[filename] !== undefined) {
      return cb(null, this.cachedState[filename]);
    }
    const params = {
      Bucket: this.bucket,
      Key: filename
    };
    this.s3.getObject(params, (err, data) => {
      if (err && err.statusCode == 404) {
        this.cachedState[filename] = null;
        cb(null, null);
      } else if (err) {
        cb(err, null);
      } else {
        const state = JSON.parse(data.Body.toString());
        this.cachedState[filename] = state;
        cb(null, state);
      }
    });
  }
}

module.exports = S3Store;
