# plugin order determines precedence
module.exports = [
  require "./ignore"
  require "./rate-limit"
  require "./bing"
  require "./bitly"
  require "./chief"
  require "./coins"
  require "./roll"
  require "./hash"
  require "./hi"
  require "./wolfram"
  require "./talk"
  #require "./google" #TODO: fix regression
  #require "./mp3" #TODO: implement tmp file storage
]