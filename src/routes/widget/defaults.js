const express = require('express');
const createError  = require('http-errors');
const db = require('../../db');

let router = express.Router({mergeParams: true});

router.route('*')

// hardcoded user op basis van access token

	.all(function(req, res, next) {
		console.log(req.query);
		if ((!req.user || req.user.id == 1) && req.query.access_token && req.query.access_token == 'VRIth7Tv1j1tEyQ7Z8TnhSaqnmDXFenXoYCxrjxKMO9QwZYgLEiRfM1IU48zfMCxJEcNBm88HIzznomBhYgC3IRVFs9XguP3vi40') {
			req.setSessionUser(32);
			db.User.findById(32)
				.then(user => {
					req.user = user;
					next();
				})
		} else {
			next();
		}
	})

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

		console.log(req.params);

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
