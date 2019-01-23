const config       = require('config');
const express      = require('express');

let router = express.Router({mergeParams: true});

// base openstad widget
// --------------------

router.route('/openstad-widget')
	.get(function( req, res, next ) {
		
		var data = {
			apiUrl    : config.url,
			imageUrl  : config.url,
			config    : req.site.config,
			siteId    : req.params.siteId,
		};
		
		res.out('budgeting/openstad-widget.js', true, data);

	});

module.exports = router;
