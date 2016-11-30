var express = require('express');
var db      = require('../db');
var auth    = require('../auth');

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
		
		db.User.findByCredentials(userName, password).then(function( user ) {
			req.session.userId = user.id;
			req.user           = user;
			res.success('/', true);
		}).catch(function( error ) {
			next(error);
		});
	});
	
	router.get('/logout', function( req, res ) {
		req.session.destroy();
		res.success('/', true);
	});
	
	router.get('/csrf_token', function( req, res ) {
		res.format({
			html: function() {
				next(createError(406))
			},
			json: function() {
				res.json({token: req.csrfToken()});
			}
		})
	});
	
	router.route('/new')
	.all(auth.can('account:create'))
	.get(function( req, res, next ) {
		res.out('account/new', false, {
			csrfToken: req.csrfToken()
		});
	})
}