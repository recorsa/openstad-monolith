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

		if (!req.session || !req.session.userAccessToken) {
			// nvt
			return next();
		}

		// get user; zie volgende stap: check 'user heeft al gestemd'

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
				error => { throw new Error('User niet bekend') }
			)
			.then(
				json => {
					req.userData = json;
					return next()
				}
			).catch(err => {
				console.log('OAUTH GET USER CATCH ERROR');
				console.log(err);
				throw err;
			});
					
	})
	.get(function( req, res, next ) {

		if (!req.userData || !req.userData.user_id) {
			// nvt
			return next();
		}


		// check op unique code: is die al gebruikt
		// TODO: het is nogal waardeloos dat dat hier staat; dit zou alleen generiek oauth moeten zijn

		// validation - heb je al gestemd
		db.BudgetUserHasVoted
			.find({where: {userId: req.userData.user_id}})
			.then(result => {
				if (result) req.userHasVoted = true;
				return next();
			})
			.catch( err => {
				console.log('OAUTH CHECK VOTE ERR');
				console.log(err);
				return next(err)
			});

	})
	.get(function( req, res, next ) {

		var authServerLogoutUrl = config.authorization['auth-server-url'] + config.authorization['auth-server-logout-path'];
		authServerLogoutUrl = authServerLogoutUrl ? authServerLogoutUrl.replace(/\[\[clientId\]\]/, config.authorization['auth-client-id']) : '';

		var data = {
			siteId             : config.siteId, // temp
			accessToken        : req.session.userAccessToken, // temp voor dev opties

			runningIdeas       : db.Idea.getRunning('random', ['withUser']),

			userIsLoggedIn     : req.session.userAccessToken ? true : false,
			userHasVoted       : req.userHasVoted ? true : false,
			user               : req.user,

			csrfToken          : req.csrfToken(),
			fullHost           : req.protocol+'://'+req.hostname,
			authServerLogoutUrl,

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

				// og meta tags for facebook c.s.
				if (req.query.showIdea && result.runningIdeas.length) {
					let idea;
					for (let i=0; i<result.runningIdeas.length; i++ ) {
						let idea = result.runningIdeas[i];
						if (idea.id == req.query.showIdea) {
							result.ogTitle = idea.title;
							let imageUrl = '/img/placeholders/idea.jpg';
							if (idea.posterImageUrl) {
								imageUrl = idea.posterImageUrl;
							}
							if (imageUrl && !imageUrl.match(/^http/)) {
								imageUrl = req.protocol + '://' + req.host + imageUrl
							}
							result.ogImage = imageUrl;
						}
					}
				}

				res.out('budgeting/index.njk', true, result);
			})
			.catch(next);

	});

module.exports = router;
