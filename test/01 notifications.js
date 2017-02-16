var should = require('should');
var ary           = require('lodash/ary');
var Promise       = require('bluebird');

var Notifications = require('../src/notifications/Notifications');
var Publication   = Notifications.Publication;
var MemoryStore   = require('../src/notifications/MemoryStore');

describe('Notifications', function() {
	var n = init(function sendMessage( user ) {
		console.log(`USER(${user.id}, freq ${user.frequency}, last ${user.lastMessage})\n----`);
		for( let [assetName, asset] of user.assets ) {
			for( let [instanceId, events] of asset ) {
				console.log(`${assetName}(${instanceId}) [${Array.from(events)}]`);
			}
		}
		console.log();
		
		return Promise.resolve();
	});
	
	it('should work', function( done ) {
		Promise.all([
			n.hub.subscribe('email', 1, null, null, ['arg:*', '*:edit']),
			n.hub.subscribe('email', 2, 'idea', null, ['arg:add', 'vote']),
			
			n.hub.trigger(3, 'idea', 11, 'arg:add'),
			n.hub.trigger(3, 'idea', 11, 'arg:edit'),
			n.hub.trigger(1, 'idea', 12, 'arg:add'),
			n.hub.trigger(3, 'foo', 666, 'bla:edit')
		])
		.then(function() {
			return n.pub.processQueue();
		})
		.then(function() {
			return [
				n.hub.trigger(3, 'idea', 11, 'arg:add'),
				n.hub.trigger(3, 'idea', 11, 'arg:edit'),
				n.hub.trigger(1, 'idea', 12, 'arg:add'),
				n.hub.trigger(3, 'foo', 666, 'bla:edit')
			];
		})
		.all()
		.then(function( result ) {
			return n.pub.processQueue();
		})
		.then(function() {
			done();
		});
	});
});

function init( sendMessage ) {
	var store = new MemoryStore();
	var hub   = new Notifications(store);
	var pub   = hub.addPublication(new Publication('email', store, {
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
		
		sendMessage: sendMessage || function(){}
	}));
	
	return {
		hub: hub,
		pub: pub
	};
}