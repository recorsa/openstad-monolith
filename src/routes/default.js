var db = require('../db');

module.exports = function( app ) {
	app.get('/', function welcome( req, res ) {
		res.render('index.njk');
	});
}