const express = require('express');
const db = require('../../db');

let router = express.Router({mergeParams: true});

router.route('*')

// `updateUserSession` assure for both adding arguments/replies
// that the user performing the action has an anonymous profile
// with a `nickName`. This middleware is only relevant on POSt
// requests.

// dit is een kopie uit stemtool/arg. Voor nu laat ik het staan, maar raar is het wel...

// todo: het moet met een api call gaan werken

	.all(function(req, res, next){

		var {user, body} = req;

		// 1. Register/pass anonymous user.
		// 2. Update `nickName`.
		// 3. Update session ('login').
		(
			user.isAnonymous() ?
				Promise.resolve(user) :
				db.User.registerAnonymous(null)
		)
			.then(function( user ) {
				if( body.nickName || body.zipCode ) {
					var data = {};
					if( body.nickName ) data.nickName = body.nickName;
					if( body.zipCode )  data.zipCode  = body.zipCode;
					return user.update(data);
				}
			})
			.then(function( user ) {
				if (user) {
					req.setSessionUser(user.id);
					req.user = user;
				}
				next();
			})
			.catch(next);

	})

// get site

router.route('/site/:siteId(\\d+)/*')

	.all(function(req, res, next) {

		// todo: dit moet een api call worden
		var siteId = parseInt(req.params.siteId) || 1;
		db.Site.findById(siteId)
			.then(function( site ) {
				if( !site ) {
					next(createError(404, 'Site niet gevonden'));
				} else {
					req.site = site;
					next();
				}
			})
			.catch(next);
		
	})


module.exports = router;
