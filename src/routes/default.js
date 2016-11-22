var db = require('../db');

module.exports = function( app ) {
	app.get('/', function welcome( req, res ) {
		var message = req.session.userId ? 'Logged in' : 'Not logged in';
		res.send('<h1>Welcome</h1>'+message);
	});
}