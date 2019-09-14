const R = require("ramda");
const uuid = require("uuid/v4");
const {stripIndent} = require("common-tags");
const moment = require("moment");
const parseDurationLib = require("parse-duration");
const chrono = require("chrono-node");
const lt = require("long-timeout");
const {nicksMatch} = require("../../lib/nicks");
const {
  getMessages,
  setMessages,
  updateMessages,
  addMessage,
  clearMessage,
  clearMessages,
  getUnscheduledMessagesFor,
  getScheduledMessages
} = require("./state");

const FILENAME = "tell.json";

const parseDuration = (s) => {
  const dur = parseDurationLib(s);
  if (dur <= 0) return null;
  return dur + new Date().getTime();
};

const parseDate = (s) => {
  const date = chrono.parseDate(s);
  if (date == null) {
    return null;
  }
  if (date.getTime() <= new Date().getTime()) {
    return null;
  }
  return date.getTime();
};

const formatDateRelative = (date) => {
  return moment(date).fromNow();
};

module.exports = (s3Store, {style, help, match, deliver, filter}) => {
  const getState = (...args) => s3Store.getState(FILENAME, ...args);
  const saveState = (...args) => s3Store.saveState(FILENAME, ...args);

  const formatMessageForDelivery = ({recipient, sender, content, createdDate}) => {
    const from = nicksMatch(sender, recipient) ? "you" : sender;
    const ago = formatDateRelative(createdDate);
    return `${style.em("[from ")}${style.nick(from)}${style.em(`, ${ago}]`)} ${style.strong(content ? content : "*poke*")}`
  };

  const formatMessageForSender = (err, {recipient, sender, deliveryDate}) => {
    if (err) {
      return style.strong("I couldn't do it. RIP your message...");
    }
    if (Math.random() < 0.10) {
      return style.green("You know me. When I make a promise...");
    }
    if (Math.random() < 0.05) {
      return style.green("Tell that to the Covenant.");
    }
    const to = nicksMatch(sender, recipient) ? "you" : recipient;
    const when = deliveryDate ? formatDateRelative(deliveryDate) : "when active";
    return `Ok, I'll message ${style.nick(to)} ${style.em(when)}`;
  };

  const doDelivery = (messages, cb) => {
    if (!messages || messages.length == 0) return;
    for (let message of messages) {
      deliver({
        nick: message.recipient,
        channel: message.channel,
        text: formatMessageForDelivery(message)
      });
    }
    getState((err, state) => {
      if (err) return cb(err);
      const messageIds = R.map((m) => m.id, messages);
      const newState = clearMessages(messageIds, state);
      saveState(newState, (err) => {
        cb(err);
      });
    });
  };

  const scheduleDelivery = (message) => {
    lt.setTimeout(
      () => doDelivery([message], (err) => {
        if (err) {
          console.error("Something broke while delivering on schedule: ", err);
        }
      }),
      Math.max(0, message.deliveryDate - new Date().getTime())
    );
  };

  //------- high level: -------

  const loadMessages = (cb) => {
    getState((err, state) => {
      if (err) return cb(err);
      for (let message of getScheduledMessages(state)) {
        scheduleDelivery(message);
      }
      cb();
    });
  };

  const checkMessages = (nick, channel, cb) => {
    getState((err, state) => {
      if (err) return cb(err);
      cb(null, getUnscheduledMessagesFor(nick, channel, state));
    });
  };

  const saveMessage = ({recipient, channel, sender, content, deliveryDate}, cb) => {
    const msg = {
      id: uuid(),
      content,
      recipient,
      sender,
      channel,
      deliveryDate: deliveryDate,
      createdDate: new Date().getTime()
    };
    getState((err, state) => {
      if (err) return cb(err);
      const newState = addMessage(msg, state);
      saveState(newState, (err) => {
        if (err) return cb(err);
        if (deliveryDate) scheduleDelivery(msg);
        cb();
      });
    });
  };

  loadMessages((err) => {
    if (err) throw new Error("Failed to load existing messages", err);
  });

  help("tell", stripIndent`
    Leave users messages and schedules reminders in this channel.
    ${style.em(`!tell|poke [nick] [message]`)}: Messages <nick> when they next post
    ${style.em(`!at|on <date> tell|poke [nick] [message]`)}: Messages <nick> at <date>
    ${style.em(`!in <duration> tell|poke [nick] [message]`)}: Messages <nick> after <duration> has elapsed
    e.g. ${style.em("\"!at 15:44:15 est poke me\"")}, ${style.em("\"!in 30m tell jcap buy a desk\"")}
  `);

  filter(({nick, channel, reply}) => {
    checkMessages(nick, channel, (err, messages) => {
      if (err) return console.error("Failed to check for messages: ", err);
      doDelivery(messages, (err) => {
        if (err) console.error("Failed to deliver messages: ", err);
      });
    });
    return true;
  });

  match(/^!(?:tell|poke)(?:\s+(\S+):?)?(?:\s+(.+))?$/, ({nick, channel, reply}, [recipient, content]) => {
    recipient = style.clear(recipient || nick);
    recipient = recipient == "me" ? nick : recipient;
    const msg = {
      recipient,
      sender: nick,
      channel,
      content
    };
    saveMessage(msg, (err) => {
      reply(formatMessageForSender(err, msg));
    });
  });

  match(/^!(?:at|on)\s+(.+)\s+(?:tell|poke)(?:\s+(\S+):?)?(?:\s+(.+))?$/, ({nick, channel, reply}, [date, recipient, content]) => {
    const deliveryDate = date ? parseDate(style.clear(date)) : null;
    if (!deliveryDate) {
      return reply(`Please provide a date in a supported format: ${style.url("https://github.com/wanasit/chrono")}`);
    }
    recipient = style.clear(recipient || nick);
    recipient = recipient == "me" ? nick : recipient;
    const msg = {
      recipient,
      sender: nick,
      channel,
      content,
      deliveryDate
    };
    saveMessage(msg, (err) => {
      reply(formatMessageForSender(err, msg));
    });
  });

  match(`^!in\\s+(.+)\\s+(?:tell|poke)(?:\\s+(\\S+):?)?(?:\\s+(.+))?$`, ({nick, channel, reply}, [date, recipient, content]) => {
    const deliveryDate = parseDuration(date);
    if (!deliveryDate) {
      return reply(`Please provide a duration in a supported format: ${style.url("https://github.com/jkroso/parse-duration")}`);
    }
    recipient = style.clear(recipient || nick);
    recipient = recipient == "me" ? nick : recipient;
    const msg = {
      recipient,
      sender: nick,
      channel,
      content,
      deliveryDate
    };
    saveMessage(msg, (err) => {
      reply(formatMessageForSender(err, msg));
    });
  });
};
