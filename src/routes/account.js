var express = require('express');
var db      = require('../db');

module.exports = function( app ) {
	var router = express.Router();
	app.use('/account', router);
	
	router.get('/login', function loginForm( req, res ) {
		res.out('account/login', true, {
			csrfToken: req.csrfToken()
		});
	});
	router.post('/login', function tryLogin( req, res, next ) {
		var userName = req.body.userName
		  , password = req.body.password;
		
		db.User.findByCredentials(userName, password).then(function( user ) {
			req.session.userId = user.id;
			req.user           = user;
			res.format({
				html: function() {
					res.redirect('/');
				},
				json: function() {
					res.json(true);
				}
			});
		}).catch(function( error ) {
			next(error);
		});
	});
	
	router.get('/logout', function logout( req, res ) {
		req.session.destroy();
		res.format({
			html: function() {
				res.redirect('/');
			},
			json: function() {
				res.json(true);
			}
		});
	});
}