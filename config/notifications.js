var log           = require('debug')('app:notifications');
var db            = require('../src/db');
var notifications = require('../src/notifications');

db.User.findAll({where: {role: 'admin'}})
.then(function( users ) {
	return users.map(function( user ) {
		return notifications.subscribe('email', user.id, null, null, ['*']);
	});
})
.all()
.then(function() {
	log('subscribed admins to all email events');
});