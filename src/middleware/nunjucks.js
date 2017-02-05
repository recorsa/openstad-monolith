module.exports = function( app ) {
	app.use(function( req, res, next ) {
		var fullHost = req.protocol + '://' + req.hostname;
		res.locals.hostname = req.hostname;
		res.locals.url      = fullHost + req.originalUrl;
		
		next();
	});
}