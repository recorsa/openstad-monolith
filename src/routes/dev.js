var express = require('express');
var config  = require('config');
var log     = require('debug')('app:http')
var db      = require('../db');
var auth    = require('../auth');

module.exports = function( app ) {
	if( !config.get('debug') ) {
		return;
	}
	log('initiating dev routes');
	
	var router = express.Router();
	app.use('/dev', router);
	
	router.post('/reset_fixtures', auth.can('dev'), function( req, res, next ) {
		db.sequelize.sync({force: true}).then(function() {
			require('../../fixtures')(db).then(function() {
				res.json(true);
			});
		}).catch(next);
	});
	
	router.get('/csrf_token', function( req, res, next ) {
		res.format({
			html: function() {
				next(createError(406))
			},
			json: function() {
				res.json({token: req.csrfToken()});
			}
		});
	});
	
	router.get('/fonts', function( req, res, next ) {
		res.out('test/fonts', false);
	});
}