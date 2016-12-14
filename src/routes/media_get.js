var createError = require('http-errors');
var db          = require('../db');

module.exports = function( app ) {
	app.get('/image/:key', function( req, res, next ) {
		db.Image.findOne({
			where: {key: req.params.key}
		})
		.then(function( image ) {
			if( !image ) {
				return next(createError(404, 'Image not found'));
			} else {
				res.type(image.mimeType);
				res.send(image.data);
			}
		})
		.catch(next);
	});
};