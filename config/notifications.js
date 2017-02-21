var notifications = require('../src/notifications');

// Subscribe non-existent user. Will be used to send mail to the site
// administrator's email address.
notifications.subscribe('admin', 0, null, null, ['*']);