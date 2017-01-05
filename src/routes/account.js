var config       = require('config');
var express      = require('express');
var createError  = require('http-errors')

var auth         = require('../auth');
var db           = require('../db');
var mail         = require('../mail');
var noCache      = require('../middleware/nocache');
var passwordless = require('../auth/passwordless');

var uidProperty  = config.get('security.sessions.uidProperty');

module.exports = function( app ) {
	var router = express.Router();
	app.use('/account', noCache, router);
	
	// Logging in
	// ----------
	router.route('/login_email')
	.get(function( req, res ) {
		res.out('account/login_email', true, {
			csrfToken : req.csrfToken(),
			step      : 0
		});
	})
	.post(function( req, res, next ) {
		var start      = Date.now();
		var domain     = req.protocol + '://' + req.get('host')
		  , email      = req.body.email
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
			db.User.findMember(email)
			.then(function( user ) {
				if( !user ) {
					throw createError(404, 'No user with that e-mail address');
				}
				// If this user has a password, display the password field.
				// Otherwise, send a login link to the user's email address.
				return !user.passwordHash || forceToken ?
				       sendAuthToken(user, domain) :
				       null;
			})
			.then(function( user ) {
				if( user ) {
					res.out('account/token_sent', true, {
						method : 'token',
						isNew  : !user.complete
					});
				} else {
					res.out('account/login_email', true, {
						csrfToken : req.csrfToken(),
						method    : 'password',
						email     : email
					});
				}
			})
			.catch(next);
		}
	});
	
	router.route('/login_token')
	.get(function( req, res, next ) {
		res.out('account/login_token', false, {
			csrfToken : req.csrfToken(),
			token     : req.query.token,
			uid       : req.query.uid
		});
	})
	.post(function( req, res, next ) {
		var token = req.body.token;
		var uid   = req.body.uid;
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
	
	// Register new member
	// -------------------
	router.route('/register')
	.all(auth.can('account:register'))
	.get(function( req, res, next ) {
		res.out('account/register', false, {
			csrfToken: req.csrfToken()
		});
	})
	.post(function( req, res, next ) {
		db.User.registerMember(req.user, req.body.email)
		.then(sendAuthToken)
		.then(function( user ) {
			res.out('account/token_sent', true, {
				isNew: !user.complete
			});
		})
		.catch(next);
	});
	
	// Complete registration
	// ---------------------
	router.route('/complete')
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

function sendAuthToken( user, domain ) {
	if( !user.isMember() ) {
		throw createError(400, 'User is not a member');
	}
	
	return passwordless.generateToken(user.id)
	.then(function( token ) {
		mail.sendMail({
			to      : user.email,
			subject : 'AB tool: Login link',
			// html    : 'Dit is een <b>testbericht</b>',
			text    : 'token: '+domain+'/account/login_token'+
			          '?token='+token+'&uid='+user.id
		});
		return user;
	});
}