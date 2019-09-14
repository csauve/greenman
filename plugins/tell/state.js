const {nicksMatch} = require("../../lib/nicks");

const R = require("ramda");

const getMessages = (state) =>
  R.pathOr([], ["messages"], state);

const setMessages = (messages, state) =>
  R.assocPath(["messages"], messages, state);

const updateMessages = (upd, state) =>
  setMessages(upd(getMessages(state)), state);

const addMessage = (message, state) =>
  updateMessages(R.append(message), state);

const clearMessage = (messageId, state) =>
  updateMessages(R.reject((message) => message.id == messageId), state);

const clearMessages = (messageIds, state) =>
  R.reduce((s, id) => clearMessage(id, s), state, messageIds);

const getUnscheduledMessagesFor = (liveRecipient, channel, state) => {
  const predicate = (message) => (
    nicksMatch(message.recipient, liveRecipient) &&
    (!message.channel || message.channel == channel) &&
    !message.deliveryDate
  );
  const rename = ({recipient, ...rest}) => ({
    recipient: liveRecipient,
    ...rest
  });
  return R.pipe(
    getMessages,
    R.filter(predicate),
    R.map(rename)
  )(state);
};

const getScheduledMessages = (state) => R.filter(
  (message) => message.deliveryDate,
  getMessages(state)
);

module.exports = {
  getMessages,
  setMessages,
  updateMessages,
  addMessage,
  clearMessage,
  clearMessages,
  getUnscheduledMessagesFor,
  getScheduledMessages
};
