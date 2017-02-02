var config       = require('config');
var createError  = require('http-errors');
var express      = require('express');
var fs           = require('fs');
var nunjucks     = require('nunjucks');
var url          = require('url');

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
	.post(function( req, res, next ) {
		var start      = Date.now();
		var ref        = req.query.ref
		  , email      = req.body.email
		  , password   = req.body.password
		  , forceToken = !!req.body.forceToken;
		
		res.acceptCookies();
		
		if( email && password ) {
			// Login with email/password.
			db.User.findByCredentials(email, password)
			.then(function( user ) {
				req.session[uidProperty] = user.id;
				// Delay the response so that it's always a minimum of 200ms.
				var delay = Math.max(0, 200 - (Date.now() - start));
				setTimeout(function() {
					res.success(resolveURL(ref), true);
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
			token        : req.query.token,
			uid          : req.query.uid
		});
	})
	.post(function( req, res, next ) {
		var token = req.body.token;
		var uid   = req.body.uid;
		var start = Date.now();
		
		passwordless.useToken(token, uid)
		.spread(function( valid, originUrl ) {
			if( !valid ) {
				throw createError(401, 'Ongeldige link');
			}
			
			req.session[uidProperty] = uid;
			req.session['ref']       = originUrl;
			
			// Delay the response so that it's always a minimum of 200ms.
			var delay = Math.max(0, 200 - (Date.now() - start));
			setTimeout(function() {
				res.success(resolveURL(originUrl), true);
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
		if( !req.cookieConsent ) {
			req.flash('include', 'flash/cookie_info.njk');
		}
		res.out('account/register', false, {
			ref       : req.query.ref,
			csrfToken : req.csrfToken()
		});
	})
	.post(function( req, res, next ) {
		res.acceptCookies();
		
		db.User.registerMember(req.user, req.body.email)
		.then(function( user ) {
			return sendAuthToken(user, req);
		})
		.then(function( user ) {
			res.out('account/token_sent', true, {
				isNew: !user.hasCompletedRegistration()
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
			res.success(resolveURL(req.session['ref']), true);
		})
		.catch(db.sequelize.ValidationError, function( err ) {
			err.errors.forEach(function( error ) {
				req.flash('error', error.message);
			});
			res.out('account/complete', false, {
				csrfToken : req.csrfToken()
			});
		})
		.catch(next);
	});
}

function sendAuthToken( user, req ) {
	if( !user.isMember() ) {
		throw createError(400, 'User is not a member');
	}
	
	var ref = req.query.ref;
	return passwordless.generateToken(user.id, ref)
	.then(function( token ) {
		var data = {
			date     : new Date(),
			fullHost : req.fullHost,
			token    : token,
			userId   : user.id,
			ref      : ref
		};
		
		mail.sendMail({
			to          : user.email,
			subject     : 'Login link',
			html        : nunjucks.render('email/login_link.njk', data),
			text        : nunjucks.render('email/login_link_text.njk', data),
			attachments : [{
				filename : 'logo@2x.png',
				path     : 'img/logo@2x.png',
				cid      : 'logo'
			}]
		});
		return user;
	});
}

function resolveURL( ref ) {
	return url.resolve('/', ref || '');
}