module.exports = function( app ) {
	app.use(function defineOutMethod( req, res, next ) {
		res.out     = out.bind(res, req);
		res.success = success.bind(res, req);
		next();
	});
};

function out( req, viewPath, allowJSON, data ) {
	if( typeof allowJSON !== 'boolean' ) {
		throw new Error('req.out: allowJSON argument must be boolean');
	}
	
	var res = this;
	res.format({
		html: function() {
			_resolve(req, data).then(function( data ) {
				res.render(viewPath, data);
			});
		},
		json: function() {
			if( allowJSON ) {
				_resolve(req, data).then(function( data ) {
					res.json(data);
				});
			} else {
				next(createError(406));
			}
		},
		default: function() {
			res.status(406).send('Not Acceptable');
		}
	});
}

function success( req, url, data ) {
	var res = this;
	res.format({
		html: function() {
			res.redirect(url);
		},
		json: function() {
			_resolve(req, data).then(function( data ) {
				res.json(data);
			});
		},
		default: function() {
			res.status(406).send('Not Acceptable');
		}
	});
}

function _resolve( req, data ) {
	var result;
	if( data instanceof Function ) {
		result = data();
	} else if( data instanceof Object ) {
		result = data;
	} else {
		result = {result: data};
	}
	
	return Promise.resolve(result).then(function( data ) {
		if( req.session ) {
			data.messages = req.flash();
		}
		return data;
	});
}