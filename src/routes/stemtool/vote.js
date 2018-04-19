var Brute        = require('express-brute');
var config       = require('config');
var createError  = require('http-errors');
var express      = require('express');
var nunjucks     = require('nunjucks');
var Promise      = require('bluebird');

var auth         = require('../../auth');
var db           = require('../../db');

var uidProperty    = config.get('security.sessions.uidProperty');
var maxPollChoices = config.get('polls.maxChoices');

var bruteForce   = new Brute(new Brute.MemoryStore(), {
	freeRetries  : 0,
	minWait      : 60000,
	maxWait      : 900000, // 15 min
	lifetime     : 86400, // 24 hours
	failCallback : function( req, res, next, nextValidRequestDate ) {
		var retryAfter = Math.ceil((nextValidRequestDate.getTime() - Date.now())/1000);
		res.header('Retry-After', retryAfter);
		res.locals.nextValidRequestDate = nextValidRequestDate;
		res.locals.retryAfter           = retryAfter;

		next(createError(429, {nextValidRequestDate: nextValidRequestDate}));
	}
});

module.exports = function( app ) {
	app.route('/vote')
	.post(bruteForce.prevent)
	.post(fetchPoll)
	.post(auth.can('poll:vote'))
	.post(function( req, res, next ) {
		var user    = req.user;
		var poll    = req.poll;

		var zipCode = user.zipCode ? user.zipCode : req.body.zipCode;
		var choices = req.body.choices;


		// Validate. This needs to happen in the route, because
		// an error needs to reset the brute force prevention. If
		// validation errors happen in the model, the user is already
		// 'logged in' as anonymous, and the next try to vote will fail
		// because the system thinks it's already voted.
		//
		// This can be solved by checking the database for a vote instead
		// of just checking authorization.
		if( !zipCode ) {
			throw createError(400, 'Geen postcode opgegeven');
		}
		if( !Array.isArray(choices) || choices.length > maxPollChoices ) {
			throw createError(400, `Kies minimaal 1 en maximaal ${maxPollChoices} opties`);
		}
		choices.forEach(function( choice ) {
			if( poll.options.find((instance) => instance.id == choice) === undefined ) {
				throw createError(404, 'Keuze bestaat niet');
			}
		});

		(
			user.isAnonymous() ?
			Promise.resolve(user) :
			db.User.registerAnonymous(null)
		)
		.then(function( user ) {
			return user.update({zipCode});
		})
		.then(function( user ) {
			req.setSessionUser(user.id);

			// Store vote.
			return poll.addVote(user, choices, req.ip)
			.then(function() {
				req.flash('success', 'Bedankt voor je stem');
				res.success('/#vote', true);
			});
		})
		.catch(db.sequelize.ValidationError, function( err ) {
			var error = Error(err.errors[0].message);
			error.status = 400;
			next(error);
		})
		.catch(next);
	})
	.post(function( err, req, res, next ) {
		req.brute.reset(function() {
			if( err.status != 403 ) {
				req.unsetSessionUser();
			}
			next(err);
		});
	});
};

function fetchPoll( req, res, next ) {
	var {user, body} = req;
	var pollId       = body.pollId;

	if( !pollId ) {
		throw createError(400, 'Geen pollId parameter');
	}

	db.Poll.scope(
		'withVoteCount',
		{method: ['withUserVote', user.id]}
	)
	.findById(pollId)
	.then(function( poll ) {
		if( !poll ) {
			throw createError(404, 'Poll niet gevonden');
		}

		req.poll = poll;
		next();
	})
	.catch(next);
}
