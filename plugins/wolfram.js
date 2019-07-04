const c = require("irc-colors");
const request = require("request");
const xml2js = require("xml2js");
const rateLimit = require("nogo");

const limiter = rateLimit({rate: 0.3, strikes: 5, cooldown: 20});

module.exports = (bot, config) => {
  bot.help("wolfram", `${c.red(`${config.global.prefix}wa <query>`)}: Returns Wolfram Alpha results`);

  bot.cmd(`wa\\s+(.+)`, (reply, [query]) => {
    limiter(from, {go: () => {
      const url = `http://api.wolframalpha.com/v2/query?appid=${config.wolfram.appId}&input=${encodeURIComponent(query)}&format=plaintext`;

      request.get(url, (error, response, body) => {
        if (error) throw error;

        xml2js.parseString(body, (err, response) => {
          if (err) {
            reply(`Couldn't parse response, precious... ${err}`);
            return;
          }
          const result = response.queryresult;

          if (result.$.success == "true") {
            const interpretation = result.pod[0].subpod[0].plaintext[0].split("\n").join(" ");
            const answerLines = result.pod[1].subpod[0].plaintext[0].split("\n");
            if (answerLines.length == 1) {
              bot.reply(from, to, `${c.teal interpretation}: ${c.red answerLines[0]}`);
            } else {
              bot.reply(from, to, `${c.teal interpretation}:`);
              for (let answerLine of answerLines) {
                bot.say(to, `${c.red(answerLine)}`);
              }
            }
          } else {
            bot.reply(from, to, `WA responsed with error${result.tips ? `:${result.tips[0].tip[0].$.text}` : ""}`);
          }
        });
      });
    }});
  });
};
