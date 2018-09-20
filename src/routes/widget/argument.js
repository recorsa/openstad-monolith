var config       = require('config')
  , createError  = require('http-errors')
  , htmlToText   = require('html-to-text')
  , express      = require('express')
  , moment       = require('moment-timezone')
  , nunjucks     = require('nunjucks')
  , Promise      = require('bluebird')
  , csvStringify = Promise.promisify(require('csv-stringify'));
var util         = require('../../util')
  , db           = require('../../db')
  , auth         = require('../../auth')
  , mail         = require('../../mail');

let router = express.Router({mergeParams: true});

router.route('(/idea/:ideaId(\\d+))?/arguments')

// list arguments
// ----------
	.get(auth.can('arguments:list'))
	.get(function( req, res, next ) {

		// api url
		let apiUrl;
		if (req.site.config.type == 'stemtool') {
			if (req.params.ideaId) {
				apiUrl = config.url + '/api/site/' + req.params.siteId + '/idea/[[id]]/argument';
			} else {
				apiUrl = config.url + '/api/site/' + req.params.siteId + '/argument';
			}
		}
		if (req.site.config.type == 'stemvan') {
			apiUrl = config.url + '/api/site/'+req.params.siteId+'/idea/[[id]]/argument';
		}

		var data = {
			apiUrl,
			type   : req.site.config.type,
			config : req.site.config,
		};
		
		res.out('arguments/arguments.js', true, data);

	});

router.route('(?:/idea/:ideaId(\\d+))?/argument(?:(?:/:argumentId(\\d+)/edit)|/new)')

//  argument form
// --------------

	// .get(auth.can('argument:edit'))
	// .get(auth.can('argument:create'))
	.get(function( req, res, next ) {

		let argument = {}; // TODO: edit

		var data = {
			apiUrl    : config.url,
			site: req.site,
			user: req.user,
			csrf   : req.csrfToken(), // TDO: deze moet je ophalen met een api call
			argument,
		};

		if ( req.site.config.arguments.new.anonymousAllowed || ( !req.site.config.arguments.new.anonymousAllowed && req.user.id != 1 ) ) {
			// the form
			data.message = 'Formulier'

			data.showForm = true;
			
			if (req.site.config.arguments.new.anonymousAllowed) {
				data.extraFields = [];
				req.site.config.arguments.new.showFields.forEach((field) => {
					data.extraFields.push({ name: field, value: req.user[field] })
				});
			}

		} else {
			// message
			data.message = 'Je moet ingelogd zijn om een argument te kunnen plaatsen'
		}
		
		if (req.user) {
			// the form
			
		} else {
			
			
			
		}

		res.out('arguments/form.js', true, data);
		
	});


// export
// ------
module.exports = router;
