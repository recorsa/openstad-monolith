var base58       = require('bs58');
var co           = require('co');
var config       = require('config');
var createError  = require('http-errors');
var crypto       = require('crypto');
var extend       = require('lodash/extend');
var util         = require('util');
var Promise      = require('bluebird');

var TokenStore   = require('./PasswordlessTokenStore');
var _store       = Promise.promisifyAll(new TokenStore());

module.exports = {
	generateToken: co.wrap(function*( uid ) {
		var token = base58.encode(crypto.randomBytes(16));
		var ttl   = config.get('security.sessions.tokenTTL');

		yield _store.storeOrUpdateAsync(token, uid.toString(), ttl, null);
		return token;
	}),
	
	useToken: co.wrap(function*( token, uid ) {
		if( !token || !uid ) {
			throw createError(400, 'Missing token or user ID');
		}
		
		var valid = yield _store.authenticateAsync(token, uid.toString());
		if( valid ) {
			yield _store.invalidateUserAsync(uid);
		}
		return valid;
	})
};