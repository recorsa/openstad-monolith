var createError  = require('http-errors');
var express      = require('express');
var config       = require('config')
var Promise      = require('bluebird');

var util         = require('../../util');
var db           = require('../../db');
var auth         = require('../../auth');
var argVoteThreshold = config.get('ideas.argumentVoteThreshold');

module.exports = function( app ) {

	app.route('/disclaimer')
	.get(function(req, res) {
		res.out('disclaimer', false);
	});

	// View idea
	// ---------
	app.route('/')
	.all(fetchIdea)
	.all(fetchPoll)
	.all(auth.can('idea:admin', 'poll:vote', 'poll:result', 'arg:form', 'arg:add', true))
	.get(function( req, res, next) {
		res.out('index', true, {
			user      : req.user,
			idea      : req.idea,
			poll      : req.poll,
			userVote  : req.vote,
			csrfToken : req.csrfToken()
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
