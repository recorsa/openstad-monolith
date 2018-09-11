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

// map
router.route('/openstad-map')
	.get(function( req, res, next ) {

		var data = {
			apiUrl    : config.url,
		};

		res.out('elements/openstad-map.js', true, data);

	});

module.exports = router;
