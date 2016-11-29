module.exports = function( app ) {
	app.use(function defineOutMethod( req, res, next ) {
		res.out = out.bind(res);
		next();
	});
};

function out( viewPath, allowJSON, data ) {
	var res = this;
	res.format({
		html: function() {
			res.render(viewPath, data);
		},
		json: function() {
			if( allowJSON ) {
				res.json(data);
			} else {
				next(createError(406));
			}
		}
	});
}