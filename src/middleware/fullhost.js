module.exports = function( app ) {
	app.use(function( req, res, next ) {
		Object.defineProperty(req, 'fullHost', {
			get: function() {
				return (req.get('x-forwarded-proto') || req.protocol) + '://' +
						   (req.get('x-forwarded-host')  || req.get('host'));
			}
		});
		next();
	});
}