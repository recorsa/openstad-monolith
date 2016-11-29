var db = require('../db');

module.exports = function( app ) {
	app.get('/login', function loginForm( req, res ) {
		res.render('users/login', {
			csrfToken: req.csrfToken()
		});
	});
	app.post('/login', function tryLogin( req, res, next ) {
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
	
	app.get('/logout', function logout( req, res ) {
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