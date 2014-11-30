var ircClient = require("../ircClient");
var config = require("../config");
var request = require("request");
var xml2js = require("xml2js");

config.wolfram = {
    appId : "changeme"
}

function handleMessage(from, to, message) {
    var match = message.match(RegExp(config.cmdPrefix + "wa (.+)", "i"));
    if (match) {
        var input = match[1];
        request.get("http://api.wolframalpha.com/v2/query?appid=" + config.wolfram.appId + "&input=" + input + "&format=plaintext", function(error, response, body) {
            if (error) {
                console.log(error);
                return;
            }

            xml2js.parseString(body, function(error, result) {
                if (error) {
                    console.warn(error);
                    ircClient.say(to, from + ": Couldn't parse response, precious... " + error);
                    return;
                }

                var queryresult = result.queryresult;

                if (queryresult.$.success == "true") {
                    var interpretation = queryresult.pod[0].subpod[0].plaintext;
                    var answer = queryresult.pod[1].subpod[0].plaintext;
                    ircClient.say(to, from + ": " + interpretation + ": " + answer);
                } else {
                    ircClient.say(to, from + ": WA responded with error" +
                        (queryresult.tips ? (": " + queryresult.tips[0].tip[0].$.text) : "")
                    );
                }

            });
        });
    }
}

module.exports = {
    setup: function() {
        ircClient.addListener("message#", handleMessage);
    },

    shutdown: function() {
        ircClient.removeListener("message#", handleMessage);
    }
};
