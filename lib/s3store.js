const AWS = require("aws-sdk");

class S3FileStateStore {
  constructor(bucket, filename, awsConfig) {
    this.bucket = bucket;
    this.filename = filename;
    this.s3 = new AWS.S3(awsConfig);
    this.cachedState = undefined;
  }

  saveState(state, cb) {
    const params = {
      Body: JSON.stringify(state),
      Bucket: this.bucket,
      Key: this.filename
    };
    this.s3.putObject(params, (err) => {
      if (!err) this.cachedState = state;
      cb(err);
    });
  }

  getState(cb) {
    if (!(this.cachedState === undefined)) {
      return cb(null, this.cachedState);
    }
    const params = {
      Bucket: this.bucket,
      Key: this.filename
    };
    this.s3.getObject(params, (err, data) => {
      if (err && err.statusCode == 404) {
        this.cachedState = null;
        cb(null, null);
      } else if (err) {
        cb(err, null);
      } else {
        const state = JSON.parse(data.Body.toString());
        this.cachedState = state;
        cb(null, state);
      }
    });
  }
}

module.exports = S3FileStateStore;