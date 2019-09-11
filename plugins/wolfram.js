const request = require("request");
const xml2js = require("xml2js");
const calmer = require("../lib/calmer");

module.exports = (config, {help, match, style: {em, strong, clear}}) => {
  const calm = calmer(0.3, 5);

  help("wolfram", `${em("!wa <query>")}: Returns Wolfram Alpha results`);

  match(`!wa\\s+(.+)`, (ctx, [query]) => {
    if (calm(ctx.from)) {
      const url = `http://api.wolframalpha.com/v2/query?appid=${config.appId}&input=${encodeURIComponent(clear(query))}&format=plaintext`;

      request.get(url, (error, response, body) => {
        if (error) throw error;

        xml2js.parseString(body, (err, response) => {
          if (err) {
            reply(`That's not going to happen... ${err}`);
            return;
          }
          const result = response.queryresult;

          if (result.$.success == "true") {
            const interpretation = result.pod[0].subpod[0].plaintext[0].split("\n").join(" ");
            const answerLines = result.pod[1].subpod[0].plaintext[0].split("\n");
            if (answerLines.length == 1) {
              ctx.reply(`${strong(interpretation)}: ${em(answerLines[0])}`);
            } else {
              ctx.reply(`${strong(interpretation)}:`);
              for (let answerLine of answerLines) {
                ctx.reply(`\t${em(answerLine)}`);
              }
            }
          } else {
            ctx.reply(`WA responsed with error${result.tips ? `:${result.tips[0].tip[0].$.text}` : ""}`);
          }
        });
      });
    } else {
      ctx.reply("Slow down. You're losing me.")
    }
  });
};
