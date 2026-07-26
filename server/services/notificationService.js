const Notification = require('../models/Notification');
const User = require('../models/User');

const notify = async ({ recipient, actor, type, post, comment }) => {
  if (recipient.toString() === actor.toString()) return null;

  const recipientUser = await User.findById(recipient).select('notificationPreferences');
  if (recipientUser && recipientUser.notificationPreferences?.[type] === false) {
    return null; // muted this notification type
  }

  return Notification.create({ recipient, actor, type, post, comment });
};

module.exports = { notify };
