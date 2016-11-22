var errors = require('../errors');

module.exports = function( app ) {
	// Authorisation errors.
	app.use(function handleAppError( err, req, res, next ) {
		if( err instanceof errors.UnauthorizedError ) {
			res.status(401).send(err.message || 'Unauthorized');
		} else if( err instanceof errors.NotFoundError ) {
			res.status(404).send(err.message || 'Not found');
		} else {
			next(err);
		}
	});
};