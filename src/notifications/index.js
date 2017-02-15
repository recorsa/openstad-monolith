var ary           = require('lodash/ary');
var Promise       = require('bluebird');

var Notifications = require('./Notifications');
var Publication   = Notifications.Publication;
var MemoryStore   = require('./MemoryStore');

var store = new MemoryStore();
var hub   = new Notifications(store);

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
	}
}));

Promise.all([
	hub.subscribe('email', 1, null, null, ['arg:*', '*:edit']),
	hub.subscribe('email', 2, 'idea', null, ['arg:add', 'vote']),
	
	hub.trigger(3, 'idea', 11, 'arg:add'),
	hub.trigger(3, 'idea', 11, 'arg:edit'),
	hub.trigger(1, 'idea', 12, 'arg:add'),
	hub.trigger(3, 'foo', 666, 'bla:edit')
]).then(function( result ) {
	pub.processQueue(function( user ) {
		console.log(`USER(${user.id}, freq ${user.frequency})\n----`);
		for( let [assetName, asset] of user.assets ) {
			for( let [instanceId, events] of asset ) {
				console.log(`${assetName}(${instanceId}) [${Array.from(events)}]`);
			}
		}
		console.log();
	});
});