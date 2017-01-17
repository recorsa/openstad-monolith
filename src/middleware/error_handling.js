var statuses = require('statuses');

module.exports = function( app ) {
	app.use(function handleError( err, req, res, next ) {
		var env            = app.get('env');
		var status         = err.status || 500;
		var friendlyStatus = statuses[status]
		var stack          = err.stack || err.toString();
		var message        = err.message;
		// Production get  s a default message.
		var errorMessage   = env === 'development' || req.user.isAdmin() ?
		                     stack :
		                     '';
		
		if( env !== 'test' ) {
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