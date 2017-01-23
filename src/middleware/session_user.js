var config    = require('config');
var NodeCache = require('node-cache');

var db        = require('../db');
var log       = require('debug')('app:http:session-user');

// TODO: Cache cleanup — node-cache.
var uidProperty = config.get('security.sessions.uidProperty');
var userCache = new NodeCache({
	stdTTL    : config.get('security.sessions.userCacheTTL'),
	useClones : false
});

db.User.findOne({where: {id: 1, role: 'unknown'}}).then(function( unknownUser ) {
	if( !unknownUser ) {
		console.error('User ID 1 must have role \'unknown\'');
		process.exit();
	} else {
		// The unknown user stays cached forever.
		userCache.set(1, unknownUser, 0);
	}
});

module.exports = function( app ) {
	app.use(function getSessionUser( req, res, next ) {
		if( !req.session ) {
			next(new Error('express-session middleware not loaded?'));
		} else {
			getUserInstance(req.session[uidProperty] || 1)
			.then(function( user ) {
				req.user = user;
				// Pass user entity to template view.
				res.locals.user = user;
				next();
			})
			.catch(next);
		}
	});
};

function getUserInstance( userId ) {
	var user = userCache.get(userId);
	if( user ) {
		log('found user {"id":%d,"role":"%s"} in cache', user.id, user.role);
		// Update cached item's TTL.
		userCache.ttl(userId);
		return Promise.resolve(user);
	} else {
		return db.User.findById(userId).then(function( user ) {
			if( !user ) {
				throw new Error('User not found');
			}
			log('found user {"id":%d,"role":"%s"} in database', user.id, user.role);
			userCache.set(userId, user);
			return user;
		});
	}
}