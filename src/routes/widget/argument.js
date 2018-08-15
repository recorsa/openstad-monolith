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


const request = require('superagent');
const apiUrl = config.get('api.url');

let router = express.Router({mergeParams: true});

// get site
// --------
router.all('*', function( req, res, next ) {

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

router.route('(/idea/:ideaId(\\d+))?/argument')

// list arguments
// ----------
	.get(auth.can('arguments:list'))
	.get(function( req, res, next ) {

		// TODO: ja, ja, dit moet netter
		// console.log('--------------------');

		// api call
		if (req.site.config.type == 'stemtool') {
			let url = apiUrl + '/api/site/' + req.params.siteId + '/idea/' + req.params.ideaId + '/argument';
			if (!req.params.ideaId) {
				url = apiUrl + '/api/site/' + req.params.siteId + '/argument';
			}
			request
				.get( url )
				.set('Cookie', req.headers['cookie'] || '')
				.set('accept', 'json')
				.end((err, res) => {
					if (err) return next(err);
					req.arguments = res.body;
					next();
				});
		}
		
		if (req.site.config.type == 'stemvan') {
			let url = apiUrl + '/api/site/'+req.params.siteId+'/idea/'+req.params.ideaId+'/argument?sentiment=for';
			request
				.get( url )
				.set('Cookie', req.headers['cookie'] || '')
				.set('accept', 'json')
				.end((err, res) => {
					if (err) return next(err);
					req.argumentsFor = res.body;
					url = apiUrl + '/api/site/'+req.params.siteId+'/idea/'+req.params.ideaId+'/argument?sentiment=against';
					request
						.get( url )
						.set('Cookie', req.headers['cookie'] || '')
						.set('accept', 'json')
						.end((err, res) => {
							req.argumentsAgainst = res.body;
							return next();
						});
				});
		}
	})
	.get(function( req, res, next ) {

		var data = {
			config           : req.site.config,
			arguments        : req.arguments,
			argumentsFor     : req.argumentsFor,
			argumentsAgainst : req.argumentsAgainst,
		};
		
		res.out('arguments/list-widget.njk', true, data);

	});

router.route('(/idea/:ideaId(\\d+))?/argument/form')
	.get(auth.can('arguments:list'))
	.get(function( req, res, next ) {

		var data = {
		};
		
		res.out('arguments/form.js', true, data);
		
	});


// export
// ------
module.exports = router;
