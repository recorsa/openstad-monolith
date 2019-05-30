const Promise = require('bluebird');
const express = require('express');
const createError = require('http-errors');
const db      = require('../../db');
const auth    = require('../../auth');
const config  = require('config');

let router = express.Router({mergeParams: true});

// scopes: for all get requests
router
	.all('*', function(req, res, next) {
		next();
	})

// insturen van je begroting
// -------------------------
router
	.route('/')
	.post(function( req, res, next ) {
		if (config.voting && config.voting.isActive || config.budgeting && config.budgeting.isActive) {
			return next();
		} else {
			return next(createError(403, 'de stemperiode is geëindigd.'))
		}
	})
	.post(function( req, res, next ) {

		if (!req.session.userAccessToken) return next(createError(403, 'Je bent niet ingelogd'));

		// get the user info using the access token
		let url = config.authorization['auth-server-url'] + config.authorization['auth-server-get-user-path'];
		url = url.replace(/\[\[clientId\]\]/, config.authorization['auth-client-id']);

		fetch(
			url, {
				method: 'get',
				headers: {
					authorization : 'Bearer ' + req.session.userAccessToken,
				},
				mode: 'cors',
			})
			.then(
				response => response.json(),
				error => { return next(createError(403, 'User niet bekend')); }
			)
			.then(
				json => {
					req.userData = json;
					return next()
				}
			)
			.catch(err => {
				console.log('BUDGET GET USER CATCH ERROR');
				console.log(err);
				next(err);
			})

	})
	.post(function( req, res, next ) {

		// validation - heb je al gestemd
		db.BudgetVote
			.find({where: {userId: req.userData.user_id}})
			.then(result => {
				if (result) return next(createError(403, 'Je hebt al gestemd'))
				return next();
			})
			.catch(next);

	})
	.post(function( req, res, next ) {

		// validation - vote must be a list of ints
		let vote = req.body.budgetVote;
		if (!Array.isArray(vote)) return next(createError(403, 'Budget klopt niet'))
		if (vote.length == 0) return next(createError(403, 'Budget klopt niet'))
		if (vote.find(entry => parseInt(entry) != entry)) return next(createError(403, 'Budget klopt niet'))

		// validation: check if count or budget ammount is ok
		db.Idea
			.findAll({where: {id: vote}})
			.then(result => {
				if (!result) return next(createError(403, 'Budget klopt niet'))

				if ( config.voting && config.voting.votingType === 'count' ) {
					if (config.voting.minIdeas > result.length || config.voting.maxIdeas < result.length) {
						return next(createError(403, 'aantal geselecteerde plannen klopt niet'))
					}
				} else {
					let availableBudgetAmount = ( config.voting && config.voting.maxBudget ) || '300000';
					let minimalBudgetAmmount = ( config.voting && config.voting.minBudget ) || '200000';
					let currentBudgetAmount = 0;
					for (let i=0; i<result.length; i++) {
						currentBudgetAmount += result[i].budget;
					}

					if (currentBudgetAmount < minimalBudgetAmmount) {
						return next(createError(403, 'Budget klopt niet'))
					}

					if (currentBudgetAmount > availableBudgetAmount) {
						return next(createError(403, 'Budget klopt niet'))
					}
				}

				return next();
			})
			.catch(next);

	})
	.post(function( req, res, next ) {

		let vote;
		try {
			vote = JSON.stringify(req.body.budgetVote || req.session.userFormData.budgetVote);
			// TODO: hashen?
		} catch(err) {
			return next(err)
		}

		let budgetVoteData = {
			vote: vote,
			userId: req.userData.user_id,
			userIp: req.ip,
		};

		db.BudgetVote
			.create(budgetVoteData)
			.then( budgetVote => {

				// na het stemmen wordt je automatisch uitgelogd
			//	req.session.destroy();

				req.session.destroy(() => {
				//	res.success('/', true);
					res.json({message: 'stemmen gelukt'});
				});


			})
			.catch(err => {
				console.log('SAVE VOTE ERROR');
				console.log(err);
				next(err);
			});

	})

module.exports = router;
