const config       = require('config');
const express      = require('express');

let router = express.Router({mergeParams: true});

// list ideas
// ----------
router.route('/ideas-widget')

	.get(function( req, res, next ) {
		
		var data = {
			apiUrl    : config.url,
			imageUrl  : config.url,
			config    : req.site.config,
			siteId    : req.params.siteId,
		};
		
		res.out('budgeting/ideas-widget.js', true, data);

	});

router.route('/ideas-gridder-widget')

	.get(function( req, res, next ) {
		
		var data = {
			apiUrl    : config.url,
			imageUrl  : config.url,
			config    : req.site.config,
			siteId    : req.params.siteId,
		};
		
		// res.out('budgeting/ideas-widget.js', true, data);

		// TODO: eigen route? Of configuratie?
		res.out('budgeting/ideas-gridder-widget.js', true, data);

	});

module.exports = router;
