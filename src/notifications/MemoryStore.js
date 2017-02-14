var extend        = require('lodash/extend');
var util          = require('util');
var Promise       = require('bluebird');

var Notifications = require('./Notifications');
var Store         = Notifications.Store;

var MemoryStore = module.exports = function() {
	Store.call(this);
	this.pubs = new Map;
};
util.inherits(MemoryStore, Store);

extend(MemoryStore.prototype, {
	addEventListener: function( pubName, userId, assetName, assetId, eventNames ) {
		var self = this;
		eventNames.forEach(function( eventName ) {
			var event = self._assureEvent(pubName, assetName, assetId, eventName);
			event.users.add(userId);
		});
		
		return Promise.resolve();
	},
	removeEventListener: function( pubName, userId, assetName, assetId, eventNames ) {
		return Promise.resolve();
	},
	
	getUsersForEvent: function( pubName, sourceUserId, assetName, assetId, eventName ) {
		var userIds = new Set;
		function addUser( event ) {
			if( event.name === null || event.regex.test(eventName) ) {
				// Merge sets.
				userIds = new Set(function*() {
					yield* userIds;
					for( var userId of event.users ) {
						if( userId != sourceUserId ) {
							yield userId;
						}
					}
				}());
			}
		}
		
		this._eachEvent(pubName, assetName, assetId, addUser);
		this._eachEvent(pubName, assetName, null, addUser);
		this._eachEvent(pubName, null, null, addUser);
		
		return Promise.resolve(userIds);
	},
	
	queueEvent: function( pubName, assetName, assetId, eventName, userIds, options ) {
		var pub = this._assurePublication(pubName);
		
		userIds.forEach(function( userId ) {
			var user = pub.users.get(userId);
			if( !user ) {
				user = {
					id        : userId,
					frequency : Infinity,
					assets    : new Map
				};
				pub.users.set(userId, user);
			}
			// `options.frequency` always exists.
			user.frequency = Math.min(user.frequency, options.frequency);
			
			var asset = user.assets.get(assetName);
			if( !asset ) {
				asset = new Map;
				user.assets.set(assetName, asset);
			}
			var events = asset.get(assetId);
			if( !events ) {
				events = new Set;
				asset.set(assetId, events);
			}
			events.add(eventName);
		}, this);
		
		return Promise.resolve();
	},
	iterateEventQueue: function( pubName, callback, ctx ) {
		var pub = this.pubs.get(pubName);
		if( !pub ) return;
		pub.users.forEach(function( user, userId ) {
			callback.call(ctx, user, userId);
		});
	},
	clearEventQueue: function( pubName ) {
		var pub = this.pubs.get(pubName);
		if( !pub ) return;
		pub.users.clear();
	},
	
	_eachEvent: function( pubName, assetName, assetId, callback, ctx ) {
		var pub = this.pubs.get(pubName);
		if( !pub ) return;
		
		if( assetName !== undefined ) {
			processAsset(pub.assets.get(assetName));
		} else {
			pub.assets.forEach(processAsset);
		}
		
		function processAsset( asset ) {
			if( !asset ) return;
			if( assetId !== undefined ) {
				processInstance(asset.instances.get(assetId));
			} else {
				asset.instances.forEach(processInstance);
			}
		}
		function processInstance( instance ) {
			if( !instance ) return;
			instance.events.forEach(function( event ) {
				callback.call(ctx, event);
			});
		}
	},
	
	_assurePublication: function( pubName ) {
		var pub;
		if( pub = this.pubs.get(pubName) ) {
			return pub;
		} else {
			pub = {
				name   : pubName,
				assets : new Map,
				users  : new Map
			};
			this.pubs.set(pubName, pub);
			return pub;
		}
	},
	_assureAsset: function( pubName, assetName ) {
		var pub = this._assurePublication(pubName);
		var asset;
		if( asset = pub.assets.get(assetName) ) {
			return asset;
		} else {
			asset = {
				name      : assetName,
				instances : new Map
			};
			pub.assets.set(assetName, asset);
			return asset;
		}
	},
	_assureInstance: function( pubName, assetName, assetId ) {
		var asset = this._assureAsset(pubName, assetName);
		var instance;
		if( instance = asset.instances.get(assetId) ) {
			return instance;
		} else {
			instance = {
				id     : assetId,
				events : new Map
			};
			asset.instances.set(assetId, instance);
			return instance;
		}
	},
	_assureEvent: function( pubName, assetName, assetId, eventName ) {
		var instance = this._assureInstance(pubName, assetName, assetId);
		var event;
		if( event = instance.events.get(eventName) ) {
			return event;
		} else {
			event = {
				name  : eventName,
				regex : Notifications.query2RegExp(eventName),
				users : new Set
			};
			instance.events.set(eventName, event);
			return event;
		}
	}
});