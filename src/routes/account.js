var config       = require('config');
var createError  = require('http-errors');
var express      = require('express');
var url          = require('url');

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
	.post(function( req, res, next ) {
		var start      = Date.now();
		var ref        = req.query.ref
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
					res.success(url.resolve('/', ref), true);
				}, delay);
			})
			.catch(function( err ) {
				req.flash('error', err.message);
				res.out('account/login_email', false, {
					method    : 'password',
					ref       : ref,
					email     : email,
					csrfToken : req.csrfToken()
				});
			});
		} else {
			db.User.findMember(email)
			.then(function( user ) {
				if( !user ) {
					throw createError(404, 'Geen gebruiker met dit emailadres gevonden');
				}
				
				// If this user has a password, display the password field.
				// Otherwise, send a login link to the user's email address.
				return !user.passwordHash || forceToken ?
				       sendAuthToken(user, req) :
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
						method    : 'password',
						ref       : ref,
						email     : email,
						csrfToken : req.csrfToken()
					});
				}
			})
			.catch(next);
		}
	})
	.post(function( err, req, res, next ) {
		if( String(err.status)[0] != 4 || req.accepts('html', 'json') === 'json' ) {
			return next(err);
		}
		
		req.flash('error', err.message);
		res.out('account/register', false, {
			ref         : req.query.ref,
			email_login : req.body.email,
			csrfToken   : req.csrfToken()
		});
	});
	
	router.route('/login_token')
	.get(function( req, res, next ) {
		res.out('account/login_token', false, {
			csrfToken    : req.csrfToken(),
			invalidToken : !req.query.token,
			ref          : req.query.ref,
			token        : req.query.token,
			uid          : req.query.uid
		});
	})
	.post(function( req, res, next ) {
		var token = req.body.token;
		var uid   = req.body.uid;
		var ref   = req.query.ref;
		var start = Date.now();
		
		passwordless.useToken(token, uid)
		.then(function( valid ) {
			if( !valid ) {
				throw createError(401, 'Ongeldige link');
			}
			
			req.session[uidProperty] = uid;
			req.session['ref']       = ref;
			
			// Delay the response so that it's always a minimum of 200ms.
			var delay = Math.max(0, 200 - (Date.now() - start));
			setTimeout(function() {
				res.success(url.resolve('/', req.query.ref), true);
			}, delay);
		})
		.catch(next);
	})
	.post(function( err, req, res, next ) {
		if( err.status == 401 ) {
			res.out('account/login_token', false, {
				invalidToken: true
			});
		} else {
			next(err);
		}
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
			ref       : req.query.ref,
			csrfToken : req.csrfToken()
		});
	})
	.post(function( req, res, next ) {
		db.User.registerMember(req.user, req.body.email)
		.then(function( user ) {
			return sendAuthToken(user, req);
		})
		.then(function( user ) {
			res.out('account/token_sent', true, {
				isNew: !user.complete
			});
		})
		.catch(next);
	})
	.all(function( err, req, res, next ) {
		if(
			err.status == 400 || err.status == 404 ||
			req.accepts('html')
		) {
			req.flash('error', err.message);
			res.out('account/register', false, {
				ref            : req.query.ref,
				email_register : req.body.email,
				csrfToken      : req.csrfToken()
			});
		} else {
			next(err);
		}
	});
	
	// Complete registration
	// ---------------------
	router.route('/complete')
	.all(auth.can('account:complete'))
	.get(function( req, res, next ) {
		res.out('account/complete', false, {
			csrfToken : req.csrfToken()
		});
	})
	.put(function( req, res, next ) {
		req.user.completeRegistration(req.body)
		.then(function() {
			res.success(url.resolve('/', req.session['ref']), true);
		})
		.catch(next);
	});
}

function sendAuthToken( user, req ) {
	if( !user.isMember() ) {
		throw createError(400, 'User is not a member');
	}
	
	return passwordless.generateToken(user.id)
	.then(function( token ) {
		mail.sendMail({
			to      : user.email,
			subject : 'AB tool: Login link',
			// html    : 'Dit is een <b>testbericht</b>',
			text    : 'token: '+req.fullHost+'/account/login_token'+
			          '?token='+token+'&uid='+user.id+
			          '&ref='+req.query.ref
		});
		return user;
	});
}