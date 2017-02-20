var Promise = require('bluebird');
var sharp   = require('sharp');

var db      = require('../../db');

module.exports = function( params ) {
	var ideaId = params.id;
	if( !ideaId ) return;
	
	return db.Image.findAll({where: {
		ideaId    : ideaId,
		processed : false
	}})
	.then(function( images ) {
		var promises = [];
		images.forEach(function( image ) {
			if( image.sort == 0 ) {
				promises.push(generateThumbnail(image));
			}
			promises.push(resizeImage(image));
		});
	});
};

function resizeImage( image ) {
	var data = sharp(image.data)
	.jpeg({
		quality: 70
	})
	.resize(1400, 700)
	.withoutEnlargement()
	.toBuffer();
	
	return Promise.resolve(data).then(function( data ) {
		return image.update({
			mimeType  : 'image/jpeg',
			data      : data,
			processed : true
		});
	})
	.catch(function( error ) {
		console.error(error.stack);
	});
}
function generateThumbnail( image ) {
	var data = sharp(image.data)
	.jpeg({
		quality: 50
	})
	.resize(920, 360)
	.withoutEnlargement()
	.toBuffer();
	
	return Promise.resolve(data).then(function( data ) {
		var thumbFileName = db.Image.thumbName(image.key);
		return db.Image.upsert({
			ideaId    : image.ideaId,
			userId    : image.userId,
			key       : thumbFileName,
			mimeType  : 'image/jpeg',
			sort      : -1,
			data      : data,
			processed : true
		});
	})
	.catch(function( error ) {
		console.error(error.stack);
	});
}