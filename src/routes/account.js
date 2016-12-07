var config      = require('config');
var express     = require('express');
var createError = require('http-errors')
var db          = require('../db');
var auth        = require('../auth');

module.exports = function( app ) {
	var router = express.Router();
	app.use('/account', router);
	
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
			req.session.userId = user.id;
			req.user           = user;
			// Delay the response so that it's always a minimum of 200ms.
			var delay = Math.max(0, 200 - (Date.now() - start));
			setTimeout(function() {
				res.success('/', true);
			}, delay);
		}).catch(function( error ) {
			next(error);
		});
	});
	
	router.get('/logout', function( req, res ) {
		req.session.destroy();
		res.success('/', true);
	});
	
	router.get('/csrf_token', function( req, res, next ) {
		if( config.get('debug') ) {
			res.format({
				html: function() {
					next(createError(406))
				},
				json: function() {
					res.json({token: req.csrfToken()});
				}
			});
		} else {
			next(createError(410));
		}
	});
	
	router.route('/new')
	.all(auth.can('account:create'))
	.get(function( req, res, next ) {
		res.out('account/new', false, {
			csrfToken: req.csrfToken()
		});
	})
}