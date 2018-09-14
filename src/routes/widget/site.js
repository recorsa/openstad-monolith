var config       = require('config')
  , createError  = require('http-errors')
  , htmlToText   = require('html-to-text')
  , express      = require('express')
var util         = require('../../util')
  , db           = require('../../db')
  , auth         = require('../../auth')
  , mail         = require('../../mail');

let router = express.Router({mergeParams: true});

// edit site
// ---------

router.route('(?:/:siteId(\\d+)/edit)|(?:/new)')
	//.all(auth.can('site:view'))
	//.get(auth.can('site:edit'))
	.get(auth.can('site:create'))
	.get(function( req, res, next ) {

		let data = {
			apiUrl    : config.url,
			siteId : req.params.siteId,
			csrf   : req.csrfToken(), // TDO: deze moet je ophalen met een api call
		}

		res.out('sites/form.js', true, data);

	});

module.exports = router;
