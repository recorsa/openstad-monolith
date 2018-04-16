var createError  = require('http-errors');
var express      = require('express');
var Promise      = require('bluebird');

var util         = require('../../util');
var db           = require('../../db');
var auth         = require('../../auth');

module.exports = function( app ) {
	// View idea
	// ---------
	app.route('/')
	.all(function( req, res, next ) {
		db.Idea.scope(
			'summary',
			'withUser',
			'withVoteCount',
			'withPosterImage',
			{method: ['withArguments', req.user.id]},
			'withAgenda'
		)
		.findById(1)
		.then(function( idea ) {
			if( !idea ) {
				next(createError(404, 'Plan niet gevonden'));
			} else {
				req.idea = idea;
				next();
			}
		})
		.catch(next);
	})
	.all(fetchPoll)
	.all(auth.can('idea:admin', 'poll:vote', 'arg:add', true))
	.get(function( req, res, next) {
		console.log(req.poll);
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
