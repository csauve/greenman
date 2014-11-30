var ircClient = require("../ircClient");
var config = require("../config");
var Datastore = require("nedb");
var sugar = require("sugar");
var moment = require("moment");

//services
var tell = require("./tell"); //todo: what happens if tell reloads? clear and reload this reference somehow
var remindersDb = new Datastore({ filename: "reminders.db", autoload: true });
remindersDb.persistence.setAutocompactionInterval(48 * 60 * 60 * 1000);

//stores interval handle for the daily job so we can clear it during shutdown
var dailyHandle = null;
//layout is {_id: reminder, ...} where reminders have an additional timeoutHandle field
var timeouts = {};

//handle a reminder event
function handleTimeout(reminder) {
    //timeout has already been cleared, just need to remove key from timeouts list
    delete timeouts[reminder._id];
    var fromNow = moment(reminder.dateCreated).fromNow();

    //check if user is in channel, and if not send them mail using tell module instead
    ircClient.whois(reminder.name, function(info) {
        if (info.channels) {
            for (var i = 0; i < info.channels.length; i++) {
                var channel = info.channels[i].toLowerCase();
                if (channel.endsWith(reminder.channel)) {
                    ircClient.say(reminder.channel, reminder.name + ": [" + fromNow + "] " + reminder.message);
                    return;
                }
            }
        }

        //user isn't available, so send them mail instead
        mail = {
            recipient: reminder.name,
            message: "[Forwarded by reminders] " + reminder.message,
            date: reminder.dateCreated,
            sender: reminder.name
        }
        tell.sendMail([mail], function(err) {
            if (err) {
                throw err;
            }
        });
    });

}

//clear timeouts so module can reload without creating multiple timeouts for the same reminders
function clearTimeouts() {
    for (var id in timeouts) {
        clearTimeout(timeouts[id].timeoutHandle);
        delete timeouts[id];
    }
}

//from a database reminder document, creates a timeout to be executed on that date
function createTimeout(reminder) {
    var date = reminder.date;
    if (date.isFuture() && date.isValid() && !date.isAfter("24 days from now")) {
        //only load timeouts that aren't already loaded
        if (reminder._id in timeouts) {
            return;
        }
        var milliseconds = new Date().secondsUntil(date) * 1000;
        reminder.timeoutHandle = setTimeout(function() { handleTimeout(reminder) }, milliseconds);
    }
}

//daily batch job removes old reminders and loads timeouts within the next 24 days. also runs on startup
function daily() {
    //make sure we've loaded all timeouts within 24 days (max period with 32 bit millisecond delay)
    remindersDb.find({}, function(err, docs) {
        for (var i = 0; i < docs.length; i++) {
            if (docs[i].date.isPast()) {
                //if the date is old, remove it from the db, and also assert it's not in the loaded timeouts
                if (docs[i]._id in timeouts) {
                    clearTimeout(timeouts[docs[i]._id].timeoutHandle);
                }
                remindersDb.remove({_id: docs[i]._id}, {}, function(err, numRemoved) {
                    if (err || numRemoved == 0) {
                        console.log("Couldn't remove old date");
                    }
                });
            } else {
                //otherwise set up its timeout
                createTimeout(docs[i]);
            }
        }
    });
}

//saves reminder to database and also calls createTimeout()
function saveReminder(name, channel, date, message) {
    if (!date.isValid()) {
        ircClient.say(channel, name + ": Invalid date.");
        return;
    } else if (!date.isFuture()) {
        ircClient.say(channel, name + ": The date must be in the future.")
        return;
    } else if (date.isAfter("100 years from now")) {
        ircClient.say(channel, name + ": You'll surely be dead by then.");
        return;
    }

    remindersDb.insert({
        name: name.toLowerCase(),
        channel: channel,
        date: date,
        dateCreated: new Date(),
        message: message
    }, function(err, doc) {
        if (err) {
            throw err;
        }
        createTimeout(doc);
        ircClient.say(channel, name + ": Reminder created for: " + moment(doc.date).utc().calendar() + " UTC");
    });
}

function handleMessage(nick, to, text) {
    //regex matches .in <##.##> <units> <message>, or .in <#><units> <message>
    var cmd = text.match(RegExp(config.cmdPrefix + "in\\s+(\\d+(?:\\.\\d+)?)(?:\\s+)?([a-zA-Z]+)\\s+(.+)", "i"));
    if (cmd) {
        var duration = parseFloat(cmd[1]);
        var units = cmd[2];
        var message = cmd[3];
        var date = moment().add(units, duration)._d;
        saveReminder(nick, to, date, message);
        return;
    }

    //secondary format is .remind <date>: <message>, where dates are UTC
    cmd = text.match(RegExp(config.cmdPrefix + "remind\\s+(.+):\\s+(.+)"));
    if (cmd) {
        var date = Date.utc.create(cmd[1].trim());
        var message = cmd[2];
        saveReminder(nick, to, date, message);
        return;
    }
}

module.exports = {
    setup: function() {
        daily();
        dailyHandle = setInterval(daily, 24 * 60 * 60 * 1000);
        ircClient.addListener("message#", handleMessage);
    },

    shutdown: function() {
        ircClient.removeListener("message#", handleMessage);
        clearInterval(dailyHandle);
        clearTimeouts();
    }
};