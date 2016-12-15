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
	router.get('/login', function( req, res ) {
		res.out('account/login', true, {
			csrfToken: req.csrfToken()
		});
	});
	
	router.post('/login', function( req, res, next ) {
		var userName = req.body.userName
		  , password = req.body.password;
		
		var start = Date.now();
		db.User.findByCredentials(userName, password)
		.then(function( user ) {
			req.session[uidProperty] = user.id;
			// Delay the response so that it's always a minimum of 200ms.
			var delay = Math.max(0, 200 - (Date.now() - start));
			setTimeout(function() {
				res.success('/', true);
			}, delay);
		}).catch(next);
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
		var actualUser;
		req.user.upgradeToMember(req.body.email)
		.then(function( user ) {
			// `req.user` can be the default unknown user account, in which
			// case the `upgradeToMember` promise will resolve with a new user.
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
			res.out('account/token_sent', true, {
				isNew: !actualUser.complete
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