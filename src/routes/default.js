module.exports = function( app ) {
	app.get('/', function( req, res ) {
		req.session.userId = 1;
		res.send('<h1>Success</h1>');
	});
}