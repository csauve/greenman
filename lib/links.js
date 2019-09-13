const getTitleAtUrl = require("url-to-title");

//library doesn't trim -- also ignore errors
const getLinkTitle = (url, cb) => {
  getTitleAtUrl(url, (err, title) => cb(title ? title.trim() : null));
};

const formatLink = (style, {url, title}) => {
  return title ?
    `${style.em(`[${title}]`)} ${style.url(url)}` :
    style.url(url);
};

module.exports = {getLinkTitle};
