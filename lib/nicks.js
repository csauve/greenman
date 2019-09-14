const R = require("ramda");
const Levenshtein = require("levenshtein");

const alphanumeric = R.replace(/[^0-9A-Za-z]/g, "");
const sanitizeNick = R.compose(R.trim, R.toLower, alphanumeric);

const nicksMatch = (nickA, nickB) => {
  const a = sanitizeNick(nickA);
  const b = sanitizeNick(nickB);
  const l = new Levenshtein(a, b);
  return a == b || (a.length > 4 && b.length > 4 && l.distance < 2);
};

module.exports = {
  nicksMatch: nicksMatch
};
