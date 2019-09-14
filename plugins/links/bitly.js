const request = require("request");
const normalizeUrl = require("normalize-url");

const bitly = (token) => {
  return (longUrl, cb) => {
    const options = {
      url: "https://api-ssl.bitly.com/v4/bitlinks",
      headers: {"Authorization": `Bearer ${token}`},
      json: true,
      body: {
        domain: "j.mp",
        long_url: normalizeUrl(longUrl).trim()
      }
    };

    request.post(options, (err, response, body) => {
      if (err) {
        cb(err);
      } else {
        cb(null, body.link.trim());
      }
    });
  };
}

module.exports = bitly;
