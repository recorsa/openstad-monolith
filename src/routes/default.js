var db      = require('../db');
var noCache = require('../middleware/nocache');

module.exports = function( app ) {
	app.get('/', noCache, function welcome( req, res ) {
		res.render('index');
	});
}