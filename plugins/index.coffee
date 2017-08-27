# plugin order determines precedence
module.exports = [
  require "./ignore"
  require "./rate-limit"
  require "./clean-text"
  require "./tell"
  require "./chief"
  require "./coins"
  require "./roll"
  require "./hash"
  require "./hi"
  require "./wolfram"
  require "./talk"
  require "./google"
  require "./die"
  require "./mp3"
  require "./links"
]