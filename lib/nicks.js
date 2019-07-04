const R = require("ramda");

const alphanumeric = R.replace(/[^0-9A-Za-z]/g, "");
const sanitizeNick = R.compose(R.trim, R.toLower, alphanumeric);
const nicksMatch = (nickA, nickB) => sanitizeNick(nickA) == sanitizeNick(nickB);

module.exports = {
  nicksMatch: nicksMatch
};