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
  updateMessages(R.reject((message) => message.id == messageId)), state);

const clearMessages = (messageIds, state) =>
  R.reduce((s, id) => clearMessage(id, s), state, messageIds);

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
