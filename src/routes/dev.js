var express = require('express');
var db      = require('../db');
var auth    = require('../auth');

module.exports = function( app ) {
	var router = express.Router();
	app.use('/dev', router);
	
	router.post('/reset_fixtures', auth.can('dev'), function( req, res, next ) {
		db.sequelize.sync({force: true}).then(function() {
			require('../../fixtures')(db).then(function() {
				res.json(true);
			});
		}).catch(next);
	});
}