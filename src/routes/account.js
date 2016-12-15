var config       = require('config');
var express      = require('express');
var createError  = require('http-errors')

var auth         = require('../auth');
var db           = require('../db');
var passwordless = require('../auth/Passwordless');

var uidProperty  = config.get('security.sessions.uidProperty');

module.exports = function( app ) {
	var router = express.Router();
	app.use('/account', router);
	
	// Logging in/out
	// --------------
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
		passwordless.useTokenAsync(token, uid).then(function( valid ) {
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
	router.get('/logout', function( req, res ) {
		req.session.destroy();
		res.success('/', true);
	});
	
	// Requesting login token
	// ----------------------
	router.route('/token')
	.all(auth.can('account:token'))
	.get(function( req, res, next ) {
		res.out('account/token', false, {
			csrfToken: req.csrfToken()
		});
	})
	.post(
		passwordless.requestToken(function( email, delivery, callback, req ) {
			db.User.findOne({where: {email: email}})
			.then(function( user ) {
				callback(null, user ? user.id : null);
			})
			.catch(callback);
		}, {
			userField: 'email'
		}),
		function( req, res ) {
			res.success('/account/token_sent', true);
		}
	);
	router.get('/token_sent', function( req, res ) {
		res.out('account/token_sent', false);
	});
	
	// Create new account
	// ------------------
	router.route('/new')
	.all(auth.can('account:create'))
	.get(function( req, res, next ) {
		res.out('account/new', false, {
			csrfToken: req.csrfToken()
		});
	});
}