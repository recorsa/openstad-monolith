module.exports = function( app ) {
	app.use(function defineOutMethod( req, res, next ) {
		res.out     = out.bind(res);
		res.success = success.bind(res);
		next();
	});
};

function out( viewPath, allowJSON, data ) {
	if( typeof allowJSON !== 'boolean' ) {
		throw new Error('req.out: allowJSON argument must be boolean');
	}
	
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
		},
		default: function() {
			res.status(406).send('Not Acceptable');
		}
	});
}

function success( url, data ) {
	var res = this;
	res.format({
		html: function() {
			res.redirect(url);
		},
		json: function() {
			res.json(data);
		},
		default: function() {
			res.status(406).send('Not Acceptable');
		}
	});
}