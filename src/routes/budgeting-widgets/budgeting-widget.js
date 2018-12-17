const config       = require('config');
const express      = require('express');

let router = express.Router({mergeParams: true});

// xxx
// ----------
router.route('/budgeting-widget')
	.get(function( req, res, next ) {

		// Figure out idea sorting, and store in the user's session.
		// var sort = (req.query.sort || '').replace(/[^a-z_]+/i, '') ||
		//            req.cookies['idea_sort'];
		// if( sort ) {
		//  	res.cookie('idea_sort', sort, {
		//  		expires: 0
		//  	});
		// }
		
		var data = {
			siteId      : req.params.siteId,
			accessToken : req.session.userAccessToken,
			csrfToken   : req.csrfToken(),
		};
		
		res.out('budgeting/budgeting-widget.js', true, data);

	});

module.exports = router;
