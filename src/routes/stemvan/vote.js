// TODO: voting is mostly done in idea.js
// this is a new setup that only contains specific calls
// The rest will be migrated over time

var Brute        = require('express-brute');
var config       = require('config');
var createError  = require('http-errors');
var express      = require('express');
var fs           = require('fs');
var nunjucks     = require('nunjucks');
var url          = require('url');

var auth         = require('../../auth');
var db           = require('../../db');
var mail         = require('../../mail');
var passwordless = require('../../auth/passwordless');

var uidProperty  = config.get('security.sessions.uidProperty');

module.exports = function( app ) {

	var router = express.Router();
	app.use('/idea/:ideaId(\\d+)/vote', router);

	// confirm vote
	// ------------
	router.route('/confirm')
		.get(function( req, res, next ) {
			var token = req.query.token;
			var uid   = req.query.uid;
			var start = Date.now();

			if (req.query.type != 'confirmVote') {
				return next(createError(500, 'Niet geimplementeerd'))
			}

			var originUrl = '';
			passwordless.useToken(token, uid)
				.then(function( url ) {
					originUrl = url;
					req.setSessionUser(uid, originUrl);
					return db.Vote.find({ where: {userId: uid} })  // TODO: werkt alleen bij 1 vote pper peroon
						.then(vote => { req.vote = vote; return vote })
				})
				.then(function() {
					if (!req.vote) throw new Error('Stem niet gevonden');
					if (req.vote.confirmIdeaId) {
						return req.vote.update({
							ideaId: req.vote.confirmIdeaId,
							confirmIdeaId: null,
						})
					} else {
						return req.vote.update({
							confirmed: true
						})
					}
				})
				.then(function() {
					console.log(req.user.id, req.user.zipCode, req.user.email);
					console.log(originUrl);
					res.success(resolveURL(originUrl), true);
				})
				.catch(next);
			
		})
		.post(function( err, req, res, next ) {
			if( err.status == 401 ) {
				res.out('account/login_token', false, {
					invalidToken: true
				});
			} else {
				next(err);
			}
		});
	
}

function resolveURL( ref ) {
	var target = url.parse(ref || '', false, true);
	var path   = target.path;
	return url.resolve('/', path || '');
}
