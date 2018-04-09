var createError  = require('http-errors')
  , express      = require('express')
  , Promise      = require('bluebird')
var util         = require('../../util')
  , db           = require('../../db')
  , auth         = require('../../auth')

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
			'withPoll',
			'withAgenda'
		)
		.findById(2)
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
	.all(auth.can('idea:view', 'idea:*', 'user:mail'))
	.get(function( req, res, next) {
		res.out('index', true, {
			idea      : req.idea,
			userVote  : req.vote,
			csrfToken : req.csrfToken()
		});
	});
};