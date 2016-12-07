var express     = require('express')
  , multer      = require('multer')
  , createError = require('http-errors')
var db          = require('../db');
var auth        = require('../auth');

var upload = multer();

module.exports = function( app ) {
	app.post('/image', upload.single('file'), function( req, res, next ) {
		var file = req.file;
		switch( file.mimetype ) {
			case 'image/png':
			case 'image/jpg':
			case 'image/jpeg':
			case 'image/gif':
				break;
			default:
				return next(createError(415, 'Unsupported media type'));
		}
		
		db.Image.create({
			userId   : req.user.id,
			key      : req.body.key,
			mimeType : file.mimetype,
			data     : file.buffer
		})
		.then(function() {
			res.status(204).send();
		})
		.catch(next);
	});
	
	app.get('/image/:key', function( req, res, next ) {
		db.Image.findOne({
			where: {key: req.params.key}
		})
		.then(function( image ) {
			res.type(image.mimeType);
			res.send(image.data);
		})
		.catch(next);
	});
};