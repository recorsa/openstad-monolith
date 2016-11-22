var db = require('../db');

module.exports = function( app ) {
	app.get('/', function( req, res ) {
		var message = req.session.userId ? 'Logged in' : 'Not logged in';
		res.send('<h1>Welcome</h1>'+message);
	});
	
	app.get('/login', function( req, res ) {
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
	app.post('/login', function( req, res, next ) {
		var userName = req.body.userName
		  , password = req.body.password;
		
		db.User.findByCredentials(userName, password).then(function( user ) {
			req.session.userId = user.id;
			res.send('<h1>Login succeeded</h1>');
		}).catch(function( error ) {
			next(error);
		});
	});
	
	app.get('/logout', function( req, res ) {
		req.session.destroy();
		res.send('<h1>Logged out</h1>');
	});
}