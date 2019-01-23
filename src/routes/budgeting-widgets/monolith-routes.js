const express = require('express');
const fetch = require('isomorphic-fetch');
const nunjucks = require('nunjucks');
const config = require('config');
const db = require('../../db');

let router = express.Router({mergeParams: true});

// toon de begroten pagina
// -----------------------
router
	.route('/$')
	.get(function( req, res, next ) {

		var data = {
			siteId      : config.siteId, // temp
			accessToken : req.session.userAccessToken, // temp voor dev opties
		};

		res.out('budgeting/monolith-page.njk', false, data);

	});

module.exports = router;
