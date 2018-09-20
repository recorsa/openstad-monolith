var config       = require('config')
  , createError  = require('http-errors')
  , htmlToText   = require('html-to-text')
  , express      = require('express')
  , moment       = require('moment-timezone')
  , nunjucks     = require('nunjucks')
  , Promise      = require('bluebird')
  , csvStringify = Promise.promisify(require('csv-stringify'));
var util         = require('../../util')
  , db           = require('../../db')
  , auth         = require('../../auth')
  , mail         = require('../../mail');

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
			apiUrl    : config.url,
		};

		res.out('elements/openstad-map.js', true, data);

	});

module.exports = router;
