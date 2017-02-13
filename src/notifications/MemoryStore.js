var extend        = require('lodash/extend');
var util          = require('util');
var Notifications = require('./Notifications');

var MemoryStore = module.exports = function() {
	Notifications.Store.call(this);
};
util.inherits(MemoryStore, Notifications.Store);

extend(MemoryStore.prototype, {
	addEvent: function( userId, assetName, assetId, eventNames ) {
		eventNames.forEach(function( eventName ) {
			var event = this._assureEvent(assetName, assetId, eventName);
			event.users.add(userId);
		}, this);
	},
	removeEvent: function( userId, assetName, assetId, eventNames ) {
		
	},
	
	getUsersForEvent: function( assetName, assetId, eventName ) {
		var userIds = new Set;
		this._eachEvent(assetName, assetId, addUser);
		this._eachEvent(assetName, null, addUser);
		this._eachEvent(null, null, addUser);
		return userIds;
		
		function addUser( event ) {
			if( event.name === null || event.regex.test(eventName) ) {
				// Merge sets.
				userIds = new Set(function*() {
					yield* userIds;
					yield* event.users;
				}());
			}
		}
	},
	
	_eachEvent: function( assetName, assetId, callback, ctx ) {
		if( assetName !== undefined ) {
			processAsset(this.assets.get(assetName));
		} else {
			this.assets.forEach(processAsset);
		}
		
		function processAsset( asset ) {
			if( !asset ) return;
			if( assetId != undefined ) {
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
				regex : this._query2RegExp(eventName),
				users : new Set
			};
			instance.events.set(eventName, event);
			return event;
		}
	},
	
	_query2RegExp: function( query ) {
		return new RegExp(Notifications.query2RegExpString(query));
	}
});