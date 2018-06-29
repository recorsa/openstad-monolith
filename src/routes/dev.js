var express = require('express');
var config  = require('config');
var log     = require('debug')('app:http')
var db      = require('../db');
var auth    = require('../auth');
var mail    = require('../mail');

module.exports = function( app ) {
	if( !config.get('debug') ) {
		return;
	}
	log('initiating dev routes');
	
	var router = express.Router();
	app.use('/dev', router);
	
	router.get('/login/:userId', function( req, res, next ) {
		var userId = Number(req.params.userId);
		req.setSessionUser(userId);
		res.success('/');
	});
	
	router.post('/reset_fixtures', auth.can('dev'), function( req, res, next ) {
		db.sequelize.sync({force: true}).then(function() {
			require('../../../fixtures')(db).then(function() {
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
		var cron = require('../../cron/randomize_idea_sort');
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
		
	var data    = {
		date     : new Date(),
		user     : req.user,
		idea     : { id: 24 },
		fullHost : req.protocol+'://'+req.hostname
	};
	var html = nunjucks.render('email/idea_created.njk', data);
	var text = 'whatever'

	let attachments;
  // TODO: ff een snelle oplossing één dag voor live; verzin hier iets generieks voor
	let site = config.get('siteId');
	console.log(site);
	if ( site == 'zorggoedvoordestad' ) {
		attachments = [{
			filename : 'email.kaart.png',
			path     : 'img/eberhardvanderlaan/email.kaart.png',
			cid      : 'kaart'
		}, {
			filename : 'logo.svg',
			path     : 'img/logo-gemeenteams-webapplicaties.svg',
			cid      : 'logo'
		}, {
			filename : 'howto-1.png',
			path     : 'img/eberhardvanderlaan/howto-1.png',
			cid      : 'howto-1'
		}, {
			filename : 'howto-2.png',
			path     : 'img/eberhardvanderlaan/howto-2.png',
			cid      : 'howto-2'
		}, {
			filename : 'howto-3.png',
			path     : 'img/eberhardvanderlaan/howto-3.png',
			cid      : 'howto-3'
		}, {
			filename : 'howto-4.png',
			path     : 'img/eberhardvanderlaan/howto-4.png',
			cid      : 'howto-4'
		}, {
			filename : 'bullet.png',
			path     : 'img/eberhardvanderlaan/bullet.png',
			cid      : 'bullet'
		}]
	} else {
		attachments = [{
			filename : 'logo@2x.png',
			path     : 'img/email/logo@2x.png',
			cid      : 'logo'
		}, {
			filename : 'map@2x.png',
			path     : 'img/email/map@2x.png',
			cid      : 'map'
		}, {
			filename : 'steps@2x.png',
			path     : 'img/email/steps@2x.png',
			cid      : 'steps'
		}]
	}

	mail.sendMail({
		to          : req.user.email,
		subject     : 'Bedankt voor je voorstel',
		html        : html,
		text        : text,
		attachments : attachments,
	});
	});
}
