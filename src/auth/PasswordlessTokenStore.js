// Passwordless token store based on node-cache.
// 
// Original: https://github.com/andreafalzetti/passwordless-nodecache
// Modified to clean up, and to use `bcrypt` instead of `bcryptjs`.

var bcrypt       = require('bcrypt');
var extend       = require('lodash/extend');
var NodeCache    = require('node-cache');
var TokenStore   = require('passwordless-tokenstore');
var util         = require('util');

var myCache = new NodeCache();

function NodeCacheStore() {
	TokenStore.call(this);
}
util.inherits(NodeCacheStore, TokenStore);

extend(NodeCacheStore.prototype, {
	authenticate: function( token, uid, callback ) {
		if( !token || !uid || !callback ) {
			throw new Error('TokenStore:authenticate called with invalid parameters');
		}

		myCache.get(uid, function( err, item ) {
			if( err ) {
				return callback(err, false, null);
			} else if( item == undefined ) {
				// Key not found.
				return callback(null, false, null);
			}
			
			// Key found.
			this._validateToken(token, item, function( err, res ) {
				if( err ) {
					return callback(err, false, null);
				}

				if( res ) {
					if( !item.originUrl ) {
						return callback(null, true, '');
					} else {
						return callback(null, true, item.originUrl);
					}
				}

				return callback(null, false, null);
			});
		}.bind(this));
	},

	storeOrUpdate: function( token, uid, msToLive, originUrl, callback ) {
		if( !token || !uid || !msToLive || !callback ) {
			throw new Error('TokenStore:storeOrUpdate called with invalid parameters');
		}

		bcrypt.hash(token, 10, function( err, hashedToken ) {
			if( err ) {
				return callback(err);
			}

			var newRecord = {
				hashedToken : hashedToken,
				uid         : uid,
				ttl         : new Date(Date.now() + msToLive),
				originUrl   : originUrl
			};

			myCache.set(uid, newRecord, function( err, success ) {
				if( !err && success ) {
					callback();
				} else {
					callback(err);
				}
			});

		}.bind(this));
	},

	invalidateUser: function( uid, callback ) {
		if( !uid || !callback ) {
			throw new Error('TokenStore:invalidateUser called with invalid parameters');
		}

		myCache.del(uid, function( err, count ){
			if( !err ) {
				callback();
			} else {
				callback(err);
			}
		});
	},

	clear: function( callback ) {
		if( !callback ) {
			throw new Error('TokenStore:clear called with invalid parameters');
		}

		myCache.flushAll();
		callback();
	},

	length: function( callback ) {
		callback(null, myCache.keys().length);
	},

	_validateToken: function( token, storedItem, callback ) {
		if( storedItem && storedItem.ttl > new Date() ) {
			bcrypt.compare(token, storedItem.hashedToken, function( err, res ) {
				if( err ) {
					return callback(err, false, null);
				} else if( res ) {
					return callback(null, true, storedItem.originUrl);
				}
				callback(null, false, null);
			});
		} else {
			callback(null, false, null);
		}
	}
});

module.exports = NodeCacheStore;