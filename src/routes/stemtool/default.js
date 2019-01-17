var createError  = require('http-errors');
var express      = require('express');
var config       = require('config')
var Promise      = require('bluebird');

var util         = require('../../util');
var db           = require('../../db');
var auth         = require('../../auth');

module.exports = function( app ) {
	// View idea
	// ---------
	app.route('/')
	.all(fetchIdea)
	.all((req, res, next) => {
		//req.session.destroy();
		//res.success('/', true);

		console.log('req.session', req.session);

		if (!req.session.userAccessToken){
			 return next();

		 }

		if (req.session.justLoggedIn) {
			res.locals.justLoggedIn = true;
			req.session.justLoggedIn = false;
		}

		// get the user info using the access token
		let url = config.authorization['auth-server-url'] + config.authorization['auth-server-get-user-path'];
		url = url.replace(/\[\[clientId\]\]/, config.authorization['auth-client-id']);

		console.log('req.session.userAccessToken', req.session.userAccessToken);

		fetch(
			url, {
				method: 'get',
				headers: {
					authorization : 'Bearer ' + req.session.userAccessToken,
				},
				mode: 'cors',
			})
			.then((response) => {
					console.log('response', response);
					return response.json();
				},
				error => { return next(createError(403, 'User niet bekend')); }
			)
			.then(
				json => {
					req.userData = json;
					res.locals.userData = json;

					return db.User.findOne({where: {
						externalUserId: req.userData.user_id
					}})
					.then((user) => {
						if (user) {
							req.setSessionUser(user.id);
							return next();
						} else {
							const data = {
								externalUserId: req.userData.user_id,
								zipCode: req.userData.postcode,
								firstName: req.userData.firstName,
								lastName: req.userData.lastName,
							}


							console.log('===> data', data);

							console.log('===> req.userData', req.userData);

							return db.User.create(data)
								.then((user) => {
									req.setSessionUser(user.id);
									next();
								});
						}
					});
				}
			)
			.catch(err => {
				console.log('BUDGET GET USER CATCH ERROR');
				console.log(err);
				req.session.destroy();
				next();
			});


	})
	.all(fetchPoll)
	.all(auth.can('idea:admin', 'poll:vote', 'poll:result', 'arg:form', 'arg:add', true))
	.get(function( req, res, next) {

		res.out('index', true, {
			userData  : req.userData,
			user      : req.user,
			idea      : req.idea,
			poll      : req.poll,
			userVote  : req.vote,
			config    : config.get('stemtool'),
			csrfToken : req.csrfToken(),
			onReturnSubmitcomment: req.session.onReturnSubmitcomment,
			filledInComment: req.session.filledInComment,
			checkedOptionId: req.cookies.checkedOptionId
		});
	});
};

// Asset fetching
// --------------
function fetchIdea( req, res, next ) {
	db.Idea.scope(
		'summary',
		'withUser',
		'withVoteCount',
		'withPosterImage',
		'withAgenda'
	)
	.findById(1)
	.then(function( idea ) {
		if( !idea ) {
			throw createError(404, 'Plan niet gevonden');
		} else {
			req.idea = idea;
			return idea;
		}
	})
	.then(function( idea ) {
		return [
			fetchArguments(req.user.id, idea.id, 'for'),
			fetchArguments(req.user.id, idea.id, 'against')
		];
	})
	.spread(function( argumentsFor, argumentsAgainst ) {
		req.idea.argumentsFor     = argumentsFor;
		req.idea.argumentsAgainst = argumentsAgainst;
		next();
	})
	.catch(next);

	function fetchArguments( userId, ideaId, sentiment ) {
		return db.Argument.scope(
			'defaultScope',
			{method: ['withVoteCount', 'argument']},
			{method: ['withUserVote', 'argument', userId]},
			'withReactions'
		)
		.findAll({
			where: {ideaId: ideaId, sentiment: sentiment},
			order: [
				db.sequelize.literal(`yes DESC`),
				['parentId', 'DESC'],
				['createdAt', 'DESC']
			]
		});
	}
}
function fetchPoll( req, res, next ) {
	var {user, idea} = req;
	var ideaId       = idea.id;
	if( !ideaId ) {
		throw createError(400, 'Geen ideaId');
	}

	db.Poll.scope(
		'withVoteCount',
		{method: ['withUserVote', user.id]}
	).findOne({
		where: {
			ideaId: ideaId
		}
	})
	.then(function( poll ) {
		if( !poll ) {
			throw createError(404, 'Poll niet gevonden');
		}

		req.poll = poll;
		next();
	})
	.catch(next);
}
