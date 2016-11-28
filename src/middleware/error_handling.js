module.exports = function( app ) {
	// Authorisation errors.
	app.use(function handleAppError( err, req, res, next ) {
		if( err.status  ) {
			res.status(err.status).send(err.message || 'Unknown error');
		} else {
			next(err);
		}
	});
};