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
	
	router.get('/randomize_idea_sort', function( req, res, next ) {
		var cron = require('../cron/randomize_idea_sort');
		cron.onTick().then(function() {
			res.send()
		})
		.catch(next);
	});
	
	router.get('/fonts', function( req, res, next ) {
		res.out('test/fonts', false);
	});
	
	router.get('/email/:page', function( req, res, next ) {
		var fs       = require('fs');
		var nunjucks = require('nunjucks');
		
		var src = fs.readFileSync('html/email/login_link.njk', 'utf8');
		var tpl = nunjucks.compile(src);
		
		var userId = req.user.id;
		var token  = 'temp';
		var output = tpl.render({
			fullHost : req.fullHost,
			token    : token,
			userId   : userId,
			ref      : req.query.ref
		});
		
		res.send(output);
	});
}