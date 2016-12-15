var config       = require('config');
var express      = require('express');
var createError  = require('http-errors')

var auth         = require('../auth');
var db           = require('../db');
var mail         = require('../mail');
var passwordless = require('../auth/passwordless');

var uidProperty  = config.get('security.sessions.uidProperty');

module.exports = function( app ) {
	var router = express.Router();
	app.use('/account', router);
	
	// Logging in
	// ----------
	router.route('/login_email')
	.get(function( req, res ) {
		res.out('account/login', true, {
			csrfToken : req.csrfToken(),
			step      : 0
		});
	})
	.post(function( req, res, next ) {
		var start      = Date.now();
		var email      = req.body.email
		  , password   = req.body.password
		  , forceToken = !!req.body.forceToken;
		
		if( email && password ) {
			// Login with email/password.
			db.User.findByCredentials(email, password)
			.then(function( user ) {
				req.session[uidProperty] = user.id;
				// Delay the response so that it's always a minimum of 200ms.
				var delay = Math.max(0, 200 - (Date.now() - start));
				setTimeout(function() {
					res.success('/', true);
				}, delay);
			})
			.catch(next);
		} else {
			db.User.findByEmail(email)
			.then(function( user ) {
				// If this user has a password, display the password field.
				// Otherwise, send a login link to the user's email address.
				return !user.passwordHash || forceToken ?
				       sendAuthToken(req.user, email) :
				       null;
			})
			.then(function( user ) {
				if( user ) {
					res.out('account/token_sent', true, {
						method : 'token',
						isNew  : !user.complete
					});
				} else {
					res.out('account/login', true, {
						csrfToken : req.csrfToken(),
						method    : 'password',
						email     : email
					});
				}
			})
			.catch(next);
		}
	});
	
	router.get('/login_token', auth.can('account:token'), function( req, res, next ) {
		var token = req.query.token;
		var uid   = req.query.uid;
		
		var start = Date.now();
		passwordless.useToken(token, uid).then(function( valid ) {
			if( !valid ) {
				return next(createError(401, 'Invalid token'));
			}
			
			req.session[uidProperty] = uid;
			// Delay the response so that it's always a minimum of 200ms.
			var delay = Math.max(0, 200 - (Date.now() - start));
			setTimeout(function() {
				res.success('/', true);
			}, delay);
		})
		.catch(next);
	});
	
	// Logging out
	// -----------
	router.get('/logout', function( req, res ) {
		req.session.destroy();
		res.success('/', true);
	});
	
	// Requesting token
	// ----------------
	router.route('/token')
	.all(auth.can('account:token'))
	.get(function( req, res, next ) {
		res.out('account/token', false, {
			csrfToken: req.csrfToken()
		});
	})
	.post(function( req, res, next ) {
		sendAuthToken(req.user, req.body.email)
		.then(function( user ) {
			res.out('account/token_sent', true, {
				isNew: !user.complete
			});
		})
		.catch(next);
	});
	
	// Complete registration
	// ---------------------
	app.route('/complete')
	.all(auth.can('account:complete'))
	.get(function( req, res, next ) {
		res.out('account/complete', false, {
			csrfToken: req.csrfToken()
		});
	})
	.put(function( req, res, next ) {
		req.user.completeRegistration(req.body)
		.then(function() {
			res.success('/', true);
		})
		.catch(next);
	});
}

function sendAuthToken( user, email ) {
	// `user` can be the default unknown user account. That's why we
	// we assign the user returned by `upgradeToMember` to `actualUser`
	// and use that object.
	var actualUser;
	return user.upgradeToMember(email)
	.then(function( user ) {
		actualUser = user;
		return passwordless.generateToken(user.id)
	})
	.then(function( token ) {
		mail.sendMail({
			to      : actualUser.email,
			subject : 'AB tool: Login link',
			// html    : 'Dit is een <b>testbericht</b>',
			text    : 'token: http://localhost:8082/account/login_token'+
			          '?token='+token+'&uid='+actualUser.id
		});
		return actualUser;
	});
}