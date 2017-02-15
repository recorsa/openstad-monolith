'use strict';

const util         = require('util');
const defaults     = require('lodash/defaults');
const EventEmitter = require('events');
const extend       = require('lodash/extend');
const forEach      = require('lodash/forEach');
const Promise      = require('bluebird');

// Notifications manager
// ---------------------
function Notifications( store ) {
	this.store        = store;
	this.publications = new Map;
}
util.inherits(Notifications, EventEmitter);
extend(Notifications.prototype, {
	subscribe: function( pubName, userId, assetName, assetId, eventNames ) {
		if( !userId ) {
			throw Error('No user ID');
		}
		if( !Array.isArray(eventNames) ) {
			eventNames = [eventNames];
		}
		
		return this.store.addEventListener(pubName, userId, assetName, assetId, eventNames);
	},
	unsubscribe: function( pubName, userId, assetName, assetId, eventNames ) {
		if( !userId ) {
			throw Error('No user ID');
		}
		if( !Array.isArray(eventNames) ) {
			eventNames = [eventNames];
		}
		
		return this.store.removeEventListener(pubName, userId, assetName, assetId, eventNames);
	},
	
	addPublication: function( publication ) {
		if( this.publications.has(publication.name) ) {
			throw Error(`Duplicate publication name: ${publication.name}`);
		}
		this.publications.set(publication.name, publication);
		return publication;
	},
	
	trigger: function( sourceUserId, assetName, assetId, eventName ) {
		var events = [];
		
		this.publications.forEach(function( publication, pubName ) {
			events.push(
				this.store.getUsersForEvent(pubName, sourceUserId, assetName, assetId, eventName)
				.then(function( userIds ) {
					return userIds.size ?
					       publication.onEvent(assetName, assetId, eventName, userIds) :
					       null;
				})
			);
		}, this);
		
		return Promise.all(events).return(true);
	}
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

// Publication
// -----------
// assets<{
// 	assetName: [options<{
// 		events    : [eventName,...]
// 		frequency : 0
// 	}>, ...]
// }>
function Publication( name, store, options ) {
	this.name   = name;
	this.store  = store;
	this.assets = this._processEvents(options.assets);
	
	delete options.assets;
	this.options = options;
}
extend(Publication.prototype, {
	// Called by `Notifications.trigger`.
	onEvent: function( assetName, assetId, eventName, userIds ) {
		var options = this._getEventOptions(assetName, eventName);
		if( !options ) return;
		
		return this.queue(assetName, assetId, eventName, userIds, options);
	},
	queue: function( assetName, assetId, eventName, userIds, options ) {
		return this.store.queueEvent(this.name, assetName, assetId, eventName, userIds, options);
	},
	processQueue: function( callback, ctx ) {
		this.store.iterateEventQueue(this.name, callback, ctx);
		this.store.clearEventQueue(this.name);
	},
	
	_getEventOptions: function( assetName, eventName ) {
		var asset = this.assets.get(assetName) || this.assets.get('*');
		if( !asset ) return false;
		
		var def = asset.find(function( def ) {
			return def.events.find(function( regex ) {
				return regex.test(eventName);
			});
		});
		return def;
	},
	// Used in constructor.
	_processEvents: function( assets ) {
		var map = new Map;
		
		forEach(assets, function( optionSet, assetName ) {
			if( !Array.isArray(optionSet) ) {
				optionSet = [optionSet];
			}
			
			optionSet = optionSet.map(function( options ) {
				if( !Array.isArray(options.events) ) {
					throw Error('Asset definition requires an events array');
				}
				
				return extend({
					frequency: 0
				}, options, {
					events : options.events.map(Notifications.query2RegExp)
				});
			});
			
			map.set(assetName, optionSet);
		});
		
		return map;
	}
});

// Store
// -----
function Store() {}
extend(Store.prototype, {
	addEventListener    : function( pubName, userId, assetName, assetId, eventNames ) {},
	removeEventListener : function( pubName, userId, assetName, assetId, eventNames ) {},
	getUsersForEvent    : function( pubName, sourceUserId, assetName, assetId, eventName ) {},
	
	queueEvent          : function( pubName, assetName, assetId, eventName, userIds, options ) {},
	// `callback( user, userId )` — `user` is not a user entity, rather a map of
	// events with relevant asset IDs for that user.
	iterateEventQueue   : function( pubName, callback, ctx ) {},
	clearEventQueue     : function( pubName ) {}
});

// Export
// ------
Notifications.Notifications = Notifications;
Notifications.Publication   = Publication;
Notifications.Store         = Store;
module.exports              = Notifications;