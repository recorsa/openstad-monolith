'use strict';

const util         = require('util');
const EventEmitter = require('events');
const extend       = require('lodash/extend');

// Notifications manager
// ---------------------
function Notifications( store ) {
	this.store = store;
}
util.inherits(Notifications, EventEmitter);
extend(Notifications.prototype, {
	subscribe: function( userId, assetName, assetId, eventNames ) {
		if( !userId ) {
			throw Error('No user ID');
		}
		if( !Array.isArray(eventNames) ) {
			eventNames = [eventNames];
		}
		
		return this.store.addEventListener(userId, assetName, assetId, eventNames);
	},
	unsubscribe: function( userId, assetName, assetId, eventNames ) {
		if( !userId ) {
			throw Error('No user ID');
		}
		if( !Array.isArray(eventNames) ) {
			eventNames = [eventNames];
		}
		
		return this.store.removeEventListener(userId, assetName, assetId, eventNames);
	},
	
	trigger: function( sourceUserId, assetName, assetId, eventName ) {
		var self = this;
		return this.store.getUsersForEvent(sourceUserId, assetName, assetId, eventName)
	}
});

function Store() {
	this.assets = new Map;
}
extend(Store.prototype, {
	addEvent: function( userId, assetName, assetId, eventNames ) {},
	removeEvent: function( userId, assetName, assetId, eventNames ) {},
	getUsersForEvent: function( assetName, assetId, eventName ) {}
});

Notifications.query2RegExp = function( query ) {
	query = String(query).replace(/:?\*:?/g, function( match ) {
		switch( match ) {
			case '*:':
				return '(?:[^:]+:)?';
			case ':*':
				return '(?::[^:]+)?';
			case ':*:':
				return '(?::[^:]+:)|:';
			case '*':
				return '(?:.*?)';
		}
	});
	return new RegExp('^'+query+'$');
};

Notifications.Notifications = Notifications;
Notifications.Store         = Store;
module.exports              = Notifications;