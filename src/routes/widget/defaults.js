const express = require('express');
const db = require('../../db');

let router = express.Router({mergeParams: true});

router.route('*')

// `updateUserSession` assure for both adding arguments/replies
// that the user performing the action has an anonymous profile
// with a `nickName`. This middleware is only relevant on POSt
// requests.

// dit is een kopie uit stemtool/arg. Voor nu laat ik het staan, maar raar is het wel...

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

module.exports = router;
