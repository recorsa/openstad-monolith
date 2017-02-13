'use strict';

const util         = require('util');
const EventEmitter = require('events');
const extend       = require('lodash/extend');

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
		
		this.store.addEvent(userId, assetName, assetId, eventNames);
		return this;
	},
	unsubscribe: function( userId, assetName, assetId, eventNames ) {
		if( !userId ) {
			throw Error('No user ID');
		}
		if( !Array.isArray(eventNames) ) {
			eventNames = [eventNames];
		}
		
		this.store.removeEvent(userId, assetName, assetId, eventNames);
		return this;
	},
	
	trigger: function( assetName, assetId, eventName ) {
		var userIds = this.store.getUsersForEvent(assetName, assetId, eventName);
		return userIds;
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

Notifications.query2RegExpString = function( query ) {
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
	return '^'+query+'$';
};

Notifications.Notifications = Notifications;
Notifications.Store         = Store;
module.exports              = Notifications;