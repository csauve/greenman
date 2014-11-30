var ircClient = require("../ircClient");
var config = require("../config");
var moment = require("moment");
var Datastore = require("nedb");

var tellDb = new Datastore({ filename: "tell.db", autoload: true });
tellDb.persistence.setAutocompactionInterval(48 * 60 * 60 * 1000);

//lets other modules send mail too
function sendMail(outbox, callback) {
    if (outbox.length > 0) {
        tellDb.insert(outbox, function(err, newDocs) {
            callback(err);
        });
    }
}

function handleMessage(nick, to, text) {
    //check if the user has any mail
    tellDb.find({recipient: nick.toLowerCase()}).sort({date: 1}).exec(function(err, docs) {
        if (err) {
            throw err;
        } else if (docs.length == 0) {
            //no mail found
            return;
        }

        //notify recipient of each mail item
        for (var i = 0; i < docs.length; i++) {
            var fromNow = moment(docs[i].date).fromNow();
            ircClient.say(to, nick + ": [" + fromNow + "] " + docs[i].sender + ": " + docs[i].message);
        }

        //clear their mailbox now that they've been notified
        tellDb.remove({recipient: nick.toLowerCase()}, {multi: true}, function(err, numRemoved) {
            if (err) {
                throw err;
            }
        });
    });

    //check if the user wanted to send mail
    //this regex matches tell <name> <message> or tell <name, name,name> <message>
    var cmd = text.match(RegExp(config.cmdPrefix + "tell\\s+((?:(?:\\s+)?\\w+,)+(?:\\s+)?(?:\\w+)|\\w+)\\s+(.+)", "i"));
    if (cmd) {
        var recipients = cmd[1].split(",");
        var message = cmd[2];
        var date = new Date();
        var outbox = [];

        //create a mailItem to be saved for each recipient
        for (var i = 0; i < recipients.length; i++) {
            if (recipients[i]) {
                var recipient = recipients[i].trim().toLowerCase();

                if (recipient == nick.toLowerCase()) {
                    ircClient.say(to, nick + ": Tell yourself that!");
                    continue;
                }

                var mailItem = {
                    recipient: recipient,
                    message: message,
                    date: date,
                    sender: nick
                }

                outbox.push(mailItem);
            }
        }

        sendMail(outbox, function(err) {
            if (err) {
                throw err;
            }
            ircClient.say(to, nick + ": I'll pass that on when " +
                (outbox.length == 1 ? recipient + " next posts." : "they each post."));
        });
    }
}

//lookup if someone joining has any mail and tell them
function handleJoin(channel, nick, message) {
    tellDb.count({recipient: nick.toLowerCase()}, function(err, count) {
        if (count > 0) {
            ircClient.say(channel, nick + ": You have " + count + " caremail. Post something to receive.");
        }
    });
}

module.exports = {
    setup: function() {
        ircClient.addListener("join", handleJoin);
        ircClient.addListener("message#", handleMessage);
    },

    shutdown: function() {
        ircClient.removeListener("join", handleJoin);
        ircClient.removeListener("message#", handleMessage);
    },

    sendMail: sendMail
};