const c = require("irc-colors");
const S3FileStateStore = require("./common/s3store");
const R = require("ramda");
const uuid = require("uuid/v4");
const moment = require("moment");
const {stripIndent} = require("common-tags");
const parseDuration = require("parse-duration");
const chrono = require("chrono-node");
const lt = require("long-timeout");

const sanitizeNick = R.compose(R.trim, R.toLower, R.replace(/_/g, ""));

const nicksMatch = (nickA, nickB) =>
  sanitizeNick(nickA) == sanitizeNick(nickB);

const getMessages = (state) =>
  R.pathOr([], ["messages"], state);

const setMessages = (messages, state) =>
  R.assocPath(["messages"], messages, state);

const updateMessages = (upd, state) =>
  setMessages(upd(getMessages(state)), state);

const addMessage = (message, state) =>
  updateMessages(R.append(message));

const clearMessages = (messageIds, state) =>
  updateMessages(R.reject((message) => R.contains(message.id, messageIds)));

const getUnscheduledMessagesFor = (recipient, channel, state) => R.filter(
  (message) => (
    nicksMatch(message.recipient, recipient) &&
    (!message.channel || message.channel == channel) &&
    !message.deliveryDate
  ),
  getMessages(state)
);

const getScheduledMessages = (state) => R.filter(
  (message) => message.deliveryDate,
  getMessages(state)
);

const formatMessageForDelivery = ({recipient, sender, content, createdDate}) => {
  const from = nicksMatch(sender, recipient) ? "you" : sender;
  const ago = moment(createdDate).fromNow();
  return `${c.red(`(${from}, ${ago})`)} ${c.teal(content ? content : "*poke*")}`
};

const formatMessageForSender = ({recipient, sender, deliveryDate}) => {
  const to = nicksMatch(sender, recipient) ? "you" : recipient;
  const when = deliveryDate ? moment(deliveryDate).fromNow() : "when active";
  return `Ok, I'll message ${c.teal(to)} ${when}`;
};

const scheduleDelivery = (datastore, bot, message) => {
  lt.setTimeout(
    () => {
      bot.reply(message.recipient, message.channel, formatMessageForDelivery(message));
      datastore.getState((err, state) => {
        if (err) throw err;
        const newState = clearMessages([message.id], state);
        datastore.saveState(newState, (err) => {
          if (err) throw err;
        });
      });
    },
    Math.max(0, message.deliveryDate - new Date().getTime())
  );
};

const saveMessage = (datastore, bot, {recipient, channel, sender, content, deliveryDate}) => {
  const msg = {
    id: uuid(),
    content,
    recipient: recipient == "me" ? sender : recipient,
    sender,
    channel,
    deliveryDate: deliveryDate,
    createdDate: new Date().getTime()
  };
  datastore.getState((err, state) => {
    const newState = addMessage(msg, state);
    datastore.saveState(newState, (err) => {
      if (err) return bot.reply(sender, channel, "Sorry, I couldn't save the message");
      if (deliveryDate) scheduleDelivery(datastore, bot, msg);
      bot.reply(sender, channel, formatMessageForSender(msg));
    });
  });
};

const notifyMessages = (datastore, bot, nick, channel) => {
  datastore.getState((err, state) => {
    const messages = getUnscheduledMessagesFor(nick, channel, state);
    if (messages.length == 0) return;

    for (let message of messages) {
      bot.reply(nick, channel, formatMessageForDelivery(message));
    }

    const newState = clearMessages(messages.map((m) => m.id), state);
    datastore.saveState(newState, (err) => {
      if (err) throw err;
    });
  });
};

const parseDateFor = (bot, nick, channel, s) => {
  const date = chrono.parseDate(s);
  if (date == null) {
    bot.reply(nick, channel, `Please provide a date in a supported format: ${c.underline("https://github.com/wanasit/chrono")}`);
    return null;
  };
  if (date.getTime() <= new Date().getTime()) {
    bot.reply(nick, channel, "Please provide a date in the future");
    return null;
  }
  return date.getTime();
};

const parseDurationFor = (bot, nick, channel, s) => {
  const dur = parseDuration(s);
  if (dur == 0) {
    bot.reply(nick, channel, `Please provide a duration in a supported format: ${c.underline("https://github.com/jkroso/parse-duration")}`);
    return null;
  }
  if (dur < 0) {
    bot.reply(nick, channel, "Please provide a positive duration");
    return null;
  }
  return dur + new Date().getTime();
};

module.exports = {
  name: "tell",

  help: (config) => stripIndent`
    Leave users messages and schedules reminders in this channel.
    ${c.red(`${config.global.prefix}tell|poke [nick] [message]`)}: Messages <nick> when they next post
    ${c.red(`${config.global.prefix}at|on <date> tell|poke [nick] [message]`)}: Messages <nick> at <date>
    ${c.red(`${config.global.prefix}in <duration> tell|poke [nick] [message]`)}: Messages <nick> after <duration> has elapsed
    e.g. ${c.teal("\"!at 15:44:15 est poke me\"")}, ${c.teal("\"!in 30m tell jcap buy a desk")}
  `,

  init: (bot, config) => {
    const datastore = new S3FileStateStore(config.global.sharedS3Bucket, "tell.json", config.global.aws);

    datastore.getState((err, state) => {
      if (err) throw new Error("Failed to load initial state from tell.json", err);
      for (let message of getScheduledMessages(state)) {
        scheduleDelivery(datastore, bot, message);
      }
    });

    bot.msg((nick, channel) => {
      notifyMessages(datastore, bot, nick, channel);
    });

    bot.msg(new RegExp(`^${config.global.prefix}(?:tell|poke)(?:\\s+(\\S+))?(?:\\s+(.+))?$`, "i"), (nick, channel, match) => {
      saveMessage(datastore, bot, {
        recipient: match[1] || nick,
        sender: nick,
        channel,
        content: match[2]
      });
    });

    bot.msg(new RegExp(`^${config.global.prefix}(?:at|on)\\s+(.+)\\s+(?:tell|poke)(?:\\s+(\\S+))?(?:\\s+(.+))?$`, "i"), (nick, channel, match) => {
      const deliveryDate = parseDateFor(bot, nick, channel, match[1]);
      if (deliveryDate) {
        saveMessage(datastore, bot, {
          recipient: match[2] || nick,
          sender: nick,
          channel,
          content: match[3],
          deliveryDate
        });
      }
    });

    bot.msg(new RegExp(`^${config.global.prefix}in\\s+(.+)\\s+(?:tell|poke)(?:\\s+(\\S+))?(?:\\s+(.+))?$`, "i"), (nick, channel, match) => {
      const deliveryDate = parseDurationFor(bot, nick, channel, match[1]);
      if (deliveryDate) {
        saveMessage(datastore, bot, {
          recipient: match[2] || nick,
          sender: nick,
          channel,
          content: match[3],
          deliveryDate
        });
      }
    });
  }
};
