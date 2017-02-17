var ary           = require('lodash/ary');
var Promise       = require('bluebird');

var Notifications = require('./Notifications');
var Publication   = Notifications.Publication;
var MemoryStore   = require('./MemoryStore');

var store = new MemoryStore();
var hub   = new Notifications();

var pub = hub.addPublication(new Publication('email', store, {
	assets: {
		// Catch-all only used when no matching asset is found.
		'*': {
			events    : ['*']
		},
		// When asset definition is an array, the first matching
		// definition is used when triggering an event.
		'idea': [{
			events    : ['arg:*'],
			frequency : 300
		}, {
			events    : ['*'],
			frequency : 0
		}]
	},
	
	sendMessage: function( user ) {
		// TODO: Implement mail functionality.
		return Promise.resolve();
	}
}));

module.exports = {
	
};