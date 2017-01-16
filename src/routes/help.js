module.exports = function( app ) {
	app.get('/hoe-werkt-het', function( req, res, next ) {
		res.out('hoe-werkt-het', false);
	});
};