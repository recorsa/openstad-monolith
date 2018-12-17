const Promise = require('bluebird');
const express = require('express');
const db      = require('../../db');
const auth    = require('../../auth');
const config  = require('config');

let router = express.Router({mergeParams: true});

// scopes: for all get requests
router
	.all('*', function(req, res, next) {

		req.scope = ['api'];

		var sort = (req.query.sort || '').replace(/[^a-z_]+/i, '') || req.cookies['idea_sort'];
		if( sort ) {
			res.cookie('idea_sort', sort, { expires: 0 });
			if (sort == 'votes_desc' || sort == 'votes_asc') {
				req.scope.push('includeVotes'); // het werkt niet als je dat in de sort scope functie doet...
			}
			req.scope.push({ method: ['sort', req.query.sort]});
		}

		if (req.query.mapMarkers) {
			req.scope.push('mapMarkers');
		}

		if (req.query.running) {
			req.scope.push('selectRunning');
		}

		if (req.query.includeArguments) {
			req.scope.push({ method: ['includeArguments', req.user.id]});
		}

		if (req.query.includeMeeting) {
			req.scope.push('includeMeeting');
		}

		if (req.query.includePosterImage) {
			req.scope.push('includePosterImage');
		}

		if (req.query.includeUser) {
			req.scope.push('includeUser');
		}

		if (req.query.includeVoteCount) {
			req.scope.push('includeVoteCount');
		}

		if (req.query.includeUserVote) {
			// ik denk dat je daar niet het hele object wilt?
			req.scope.push({ method: ['includeUserVote', req.user.id]});
		}

		// todo
		// if (req.query.highlighted) {
		//  	query = db.Idea.getHighlighted({ siteId: req.params.siteId })
		// }

		next();

	})

router.route('/')

// list ideas
// ----------
	.get(function(req, res, next) {
		next();
	})
	.get(auth.can('ideas:list'))
	.get(function(req, res, next) {
		next();
	})
	.get(function(req, res, next) {

		db.Idea
			.scope(...req.scope)
			.findAll({ where: { siteId: req.params.siteId } })
			.then( found => {
				return found.map( entry => entry.toJSON() );
			})
			.then(function( found ) {
				res.json(found);
			})
			.catch(next);
	})

module.exports = router;
