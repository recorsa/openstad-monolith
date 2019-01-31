const express = require('express');
const config = require('config');
const db = require('../db');

let router = express.Router({mergeParams: true});

router.route('*')

// zoek de site

	.all(function(req, res, next) {
		if (!config.siteId || typeof config.siteId !== 'number') return next();
		db.Site
			.findOne({where: {id : config.siteId}})
			.then(function( found ) {
				req.site = found;
				next();
			})
			.catch(next);

	})

module.exports = router;
