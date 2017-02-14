var extend        = require('lodash/extend');
var util          = require('util');
var Promise       = require('bluebird');

var Notifications = require('./Notifications');
var Store         = Notifications.Store;

var MemoryStore = module.exports = function() {
	Store.call(this);
};
util.inherits(MemoryStore, Store);

extend(MemoryStore.prototype, {
	addEventListener: function( userId, assetName, assetId, eventNames ) {
		var self = this;
		eventNames.forEach(function( eventName ) {
			var event = self._assureEvent(assetName, assetId, eventName);
			event.users.add(userId);
		});
		
		return Promise.resolve();
	},
	removeEventListener: function( userId, assetName, assetId, eventNames ) {
		return Promise.resolve();
	},
	
	getUsersForEvent: function( sourceUserId, assetName, assetId, eventName ) {
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
		
		this._eachEvent(assetName, assetId, addUser);
		this._eachEvent(assetName, null, addUser);
		this._eachEvent(null, null, addUser);
		
		return Promise.resolve(userIds);
	},
	
	_eachEvent: function( assetName, assetId, callback, ctx ) {
		if( assetName !== undefined ) {
			processAsset(this.assets.get(assetName));
		} else {
			this.assets.forEach(processAsset);
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
	
	_assureAsset: function( assetName ) {
		var asset;
		if( asset = this.assets.get(assetName) ) {
			return asset;
		} else {
			asset = {
				name      : assetName,
				instances : new Map
			};
			this.assets.set(assetName, asset);
			return asset;
		}
	},
	_assureInstance: function( assetName, assetId ) {
		var asset = this._assureAsset(assetName);
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
	_assureEvent: function( assetName, assetId, eventName ) {
		var instance = this._assureInstance(assetName, assetId);
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