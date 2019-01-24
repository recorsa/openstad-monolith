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

// create idea
// -----------
	.post(auth.can('idea:create'))
	.post(function(req, res, next) {
		req.body.siteId = req.params.siteId;
		req.body.userId = req.user.id;
		req.body.startDate = new Date();
		db.Idea
			.create(req.body)
			.then(result => {
				res.json(result);
			})
			.catch(function( error ) {
				// todo: dit komt uit de oude routes; maak het generieker
				if( error instanceof db.sequelize.ValidationError ) {
					let errors = [];
					error.errors.forEach(function( error ) {
						// notNull kent geen custom messages in deze versie van sequelize; zie https://github.com/sequelize/sequelize/issues/1500
						errors.push(error.type === 'notNull Violation' && error.path === 'location' ? 'Kies een locatie op de kaart' : error.message);
					});
					res.status(422).json(errors);
				} else {
					next(error);
				}
			});
	})

// one idea
// --------
router.route('/:ideaId(\\d+)')
	// .all(auth.can('idea:view'))
	.all(function(req, res, next) {
		var ideaId = parseInt(req.params.ideaId) || 1;
		
		db.Idea
			.scope(...req.scope)
			.find({
				where: { id: ideaId, siteId: req.params.siteId }
			})
			.then(found => {
				if ( !found ) throw new Error('Idea not found');
				req.idea = found;
				next();
			})
			.catch(next);
	})

// view idea
// ---------
	.get(function(req, res, next) {
		res.json(req.idea);
	})

// update idea
// -----------
	//.put(auth.can('idea:edit'))
	.put(function(req, res, next) {
		req.idea
			.update(req.body)
			.then(result => {
				res.json(result);
			})
			.catch(next);
	})

// delete idea
// ---------
	.delete(auth.can('idea:delete'))
	.delete(function(req, res, next) {
		req.idea
			.destroy()
			.then(() => {
				res.json({ "idea": "deleted" });
			})
			.catch(next);
	})

module.exports = router;
