const config			 = require('config');
const express			 = require('express');
const nunjucks		 = require('nunjucks');

let router = express.Router({mergeParams: true});

// html-editor
router.route('/html-editor')
	.get(function( req, res, next ) {

		var data = {
		};

		res.out('elements/html-editor.js', true, data);

	});

// image-container
router.route('/image-container')
	.get(function( req, res, next ) {

		var data = {
		};

		res.out('elements/image-container.js', true, data);

	});

// map
router.route('/openstad-map')
	.get(function( req, res, next ) {

		var data = {
			apiUrl: config.url,
			markerStyle: config.openStadMap.markerStyle ? JSON.stringify(config.openStadMap.markerStyle) : 'null',
			polygonStyle: config.openStadMap.polygonStyle ? JSON.stringify(config.openStadMap.polygonStyle) : 'null',
			config: config.openStadMap ? JSON.stringify(config.openStadMap) : 'null',
		};

		res.out('elements/openstad-map.js', true, data);

	});

// textarea-with-counter
router.route('/textarea-with-counter')
	.get(function( req, res, next ) {

		var data = {
		};

		res.out('elements/textarea-with-counter.js', true, data);

	});

module.exports = router;

