module.exports = function(rate, burst) {
  const requestsPerSecond = rate || 1;
  const tokenFill = burst || 1;
  const buckets = {};

  return (key) => {
    const now = new Date().getTime();

    if (!buckets[key]) {
      buckets[key] = {
        tokens: tokenFill,
        lastRequest: now,
        strikes: 0
      };
    }

    const elapsedSec = (now - buckets[key].lastRequest) / 1000;
    const currTokens = buckets[key].tokens;

    buckets[key].tokens = Math.min(tokenFill, currTokens + elapsedSec * requestsPerSecond);
    buckets[key].lastRequest = now;

    if (buckets[key].tokens >= 1) {
      buckets[key].tokens--;
      return true;
    } else if (no) {
      return false;
    }
  }
}
