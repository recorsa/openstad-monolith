var log       = require('debug')('app:http:session-user');
var db        = require('../db');
var userCache = {};

db.User.findOne({where: {id: 1, role: 'unknown'}}).then(function( unknownUser ) {
	if( !unknownUser ) {
		console.error('User ID 1 must have role \'unknown\'');
		process.exit();
	} else {
		userCache[1] = unknownUser;
	}
});

module.exports = function( app ) {
	app.use(function getSessionUser( req, res, next ) {
		if( !req.session ) {
			next(new Error('express-session middleware not loaded?'));
		} else {
			getUserInstance(req.session.userId || 1)
			.then(function( user ) {
				req.user = user;
				// Pass user entity to template view.
				res.locals.user = user;
				next();
			})
			.catch(function( error ) {
				next(error);
			});
		}
	});
};

function getUserInstance( userId ) {
	var user = userCache[userId];
	if( user ) {
		log('found user {"id":%d,"role":"%s"} in cache', user.id, user.role);
		return Promise.resolve(user);
	} else {
		return db.User.findById(userId).then(function( user ) {
			if( !user ) {
				throw new Error('User not found');
			}
			log('found user {"id":%d,"role":"%s"} in database', user.id, user.role);
			// TODO: Cache cleanup.
			return userCache[userId] = user;
		});
	}
}