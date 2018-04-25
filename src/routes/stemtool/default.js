var createError  = require('http-errors');
var express      = require('express');
var Promise      = require('bluebird');

var util         = require('../../util');
var db           = require('../../db');
var auth         = require('../../auth');

module.exports = function( app ) {

	app.route('/disclaimer')
	  .get(function(req, res) {
		  res.out('disclaimer', false);
	  });

	// View idea
	// ---------
	app.route('/')
	  .all(function( req, res, next ) {
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
				    next(createError(404, 'Plan niet gevonden'));
			    } else {
				    req.idea = idea;
			    }
		    })
		    .then(function() {
          return db.Argument.scope(
					  'defaultScope',
					  {method: ['withVoteCount', 'argument']},
					  {method: ['withUserVote', 'argument', req.user.id]},
					  'withReactions'
			    )
            .findAll({where: {ideaId: 1, sentiment: 'against'}})
            .then(arguments1 => {
              req.idea.argumentsAgainst = arguments1;
            })
        })
		    .then(function() {
          return db.Argument.scope(
						'defaultScope',
						{method: ['withVoteCount', 'argument']},
						{method: ['withUserVote', 'argument', req.user.id]},
						'withReactions'
			    )
          .findAll({where: {ideaId: 1, sentiment: 'for'}})
          .then((arguments2) => {
            req.idea.argumentsFor = arguments2;
          })
        })
		    .then(function() {
				  next();
        })
		    .catch(next);
	  })
	  .all(fetchPoll)
	  .all(auth.can('idea:admin', 'poll:vote', 'arg:add', true))
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
