var createError = require('http-errors');
var statuses    = require('statuses');

module.exports = function( app ) {
	// We only get here when the request has not yet been handled by a route.
	app.use(function( req, res, next ) {
		next(createError(404, 'Pagina niet gevonden'));
	});
	
	app.use(function handleError( err, req, res, next ) {
		var env            = app.get('env');
		var status         = err.status || 500;
		var userIsAdmin    = req.user && req.user.isAdmin();
		var showDebug      = status == 500 && (env === 'development' || userIsAdmin);
		var friendlyStatus = statuses[status]
		var stack          = err.stack || err.toString();
		var message        = err.message;
		var errorMessage   = showDebug ? stack : '';
		
		if( env !== 'test' && status == 500 ) {
			console.error(stack);
		}
		
		res.status(status);
		res.out('error', true, {
			status         : status,
			friendlyStatus : friendlyStatus,
			errorMessage   : errorMessage.replace(/\x20{2}/g, ' &nbsp;'),
			message        : message
		})
	});
};