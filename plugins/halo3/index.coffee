PATTERN = ///
  (?:halo|h4lo|H410|hal0|ha1o|h@lo|halO|\|-\|\/-\|_\(\)|hola|h0la)
  \s*
  (?:tres|tripple|triple|III|three|3|1\+2|2\+1|4-1)
///i;

module.exports = init: (bot) ->
  bot.msg PATTERN, (nick, channel) ->
    bot.say channel, ".k #{nick} halo 3"