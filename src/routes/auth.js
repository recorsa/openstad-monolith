var db = require('../db');

module.exports = function( app ) {
	app.get('/login', function loginForm( req, res ) {
		if( req.session.userId ) {
			res.send('<h1>Already logged in</h1>');
		} else {
			res.send(`
				<form method="post">
					Username: <input name="userName"><br>
					Password: <input name="password" type="password"><br>
					<input type="submit" value="Login">
				</form>
			`);
		}
	});
	app.post('/login', function tryLogin( req, res, next ) {
		var userName = req.body.userName
		  , password = req.body.password;
		
		db.User.findByCredentials(userName, password).then(function( user ) {
			req.session.userId = user.id;
			req.user           = user;
			res.send('<h1>Login succeeded</h1>');
		}).catch(function( error ) {
			next(error);
		});
	});
	
	app.get('/logout', function logout( req, res ) {
		req.session.destroy();
		res.send('<h1>Logged out</h1>');
	});
}