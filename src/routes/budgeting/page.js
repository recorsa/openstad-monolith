const express = require('express');
const fetch = require('isomorphic-fetch');
const nunjucks = require('nunjucks');
const config = require('config');
const Promise = require('bluebird');
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

				runningIdeas     : db.Idea.getRunning('random', ['withUser']),

				userVoteIdeaId   : req.user.getUserVoteIdeaId(),
				userHasVoted     : req.user.hasVoted(),
				userHasConfirmed : req.user.hasConfirmed(),
				user             : req.user,

				csrfToken        : req.csrfToken(),
				isAdmin          : req.user.role == 'admin' ? true : '',
				fullHost         : req.protocol+'://'+req.hostname

			};

			if (req.path.match(/\stemmen/)) {
				data.stepNo   = '';
				data.ideaId   = '';
				data.zipCode  = '';
				data.email    = '';
				data.hasVoted = '';
			}
			
			Promise.props(data)
				.then(function( result ) {
					res.out('budgeting/index.njk', true, result);
				})
				.catch(next);

	});

module.exports = router;
