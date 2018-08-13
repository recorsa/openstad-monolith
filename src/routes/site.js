var express = require('express');
var createError = require('http-errors')
var db      = require('../db');

var router = express.Router();
router.get('*', function( req, res, next ) {

	var siteId = parseInt(req.params.siteId) || 1;
	db.Site.findById(siteId)
		.then(function( site ) {
			if( !site ) {
				next(createError(404, 'Site niet gevonden'));
			} else {
				req.site = site;
				next();
			}
		})
		.catch(next);

});

module.exports = router;
