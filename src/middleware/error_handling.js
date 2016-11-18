var errors = require('../errors');

module.exports = function( app ) {
	// Authorisation errors.
	app.use(function( err, req, res, next ) {
	  if( err instanceof errors.UnauthorizedError ) {
	    res.send(401, 'Unauthorized');
	  } else if( err instanceof errors.NotFoundError ) {
	  	res.send(404, 'Not found');
	  } else {
	    next(err);
	  }
	});
};