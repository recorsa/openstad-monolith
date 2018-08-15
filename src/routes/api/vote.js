const Promise     = require('bluebird');
const express     = require('express');
const createError = require('http-errors')
const db          = require('../../db');
const auth        = require('../../auth');

let router = express.Router({mergeParams: true});

// get idea, for all get requests
router
	.all('*', function(req, res, next) {
		var ideaId = parseInt(req.params.ideaId);
		db.Idea
			.scope('api')
			.findById(ideaId)
			.then(function( idea ) {
				if( !idea ) {
					return next(createError(404, 'Idee niet gevonden'));
				} else {
					req.idea = idea;
					return next();
				}
			})
			.catch(next);
	})

router.route('/')

// check user
// ----------
	.post(function(req, res, next) {

		if (req.site.config.votes.userRole != 'anonymous') {
			return next();
		}			

		if (req.user.id != 1) { // ToDo: blijkbaar krijgen anonieme requests deze gebruiker mee....
			return next();
		}			
			
		console.log('CREATE USER');
		// anonymous is allowed and a user does not yet exist; create one
		let zipCode = req.body.zipCode;
		if (!zipCode) {
			zipCode = '1234 EF'
			// return next(createError(403, 'Bij anoniem stemmen is een postcode verplicht'));
		}
		db.User.registerAnonymous(zipCode)
			.then(function( newUser ) {
				req.setSessionUser(newUser.id);
				req.user = newUser;
				return next();
			})
			.catch(function( error ) {
				return next(error);
			});

	})


// add vote
// --------
	.post(auth.can('idea:vote'))
	.post(function(req, res, next) {
		console.log('VOTE ----------');
		req.idea
			.addUserVote(req.user, req.body.opinion, req.ip)
			.then(voteRemoved => {
				let result = {
					vote    : req.body.opinion,
					voteRemoved,
					message : !voteRemoved ? 'U heeft gestemd' : 'Uw stem is ingetrokken',
				}
				res.json(result);
			})
			.catch(next);
	})

module.exports = router;
