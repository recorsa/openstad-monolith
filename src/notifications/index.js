var ary           = require('lodash/ary');
var Promise       = require('bluebird');

var Notifications = require('./Notifications');
var Publication   = Notifications.Publication;
var MemoryStore   = require('./MemoryStore');

var notifications = new Notifications();
var pub = notifications.addPublication(new Publication('email', new MemoryStore(), {
	autoSend: true,
	
	assets: {
		'idea': [{
			events    : ['create', 'update'],
			frequency : 0
		}],
		'arg': [{
			events    : ['create', 'update'],
			frequency : 0
		}]
	},
	sendMessage: function( user ) {
		// TODO: Implement mail functionality.
		return Promise.resolve();
	}
}));

module.exports = notifications;