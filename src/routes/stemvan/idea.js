var config       = require('config')
, createError  = require('http-errors')
, htmlToText   = require('html-to-text')
, express      = require('express')
, moment       = require('moment-timezone')
, nunjucks     = require('nunjucks')
, Promise      = require('bluebird')
, csvStringify = Promise.promisify(require('csv-stringify'));
var util         = require('../../util')
, db           = require('../../db')
, auth         = require('../../auth')
, mail         = require('../../mail')
, passwordless = require('../../auth/passwordless');

module.exports = function( app ) {
	// Idea index page
	// ---------------
	app.route('(/|/ideas|/plannen)')
		.all(auth.can('ideas:list', 'ideas:archive', 'idea:create'))
		.get(function( req, res, next ) {
			// Figure out idea sorting, and store in the user's session.
			var sort = (req.query.sort || '').replace(/[^a-z_]+/i, '') || req.cookies['idea_sort'] || config.ideas.defaultSort;
			res.cookie('idea_sort', sort, {
				expires: 0
			});
			var extraScopes = [];
			if (config.siteId == 'zorggoedvooronzestad2') {
				extraScopes.push('withUser');
			}

			var data = {
				sort             : undefined,
				runningIdeas     : db.Idea.getRunning(undefined, extraScopes),
				highlightedIdeas : db.Idea.getHighlighted(),
				upcomingMeetings : db.Meeting.getUpcoming(),
				userVoteIdeaId   : req.user.getUserVoteIdeaId(),
				userHasVoted     : req.user.hasVoted(),
				userHasConfirmed : req.user.hasConfirmed(),
				user             : req.user,
				csrfToken        : req.csrfToken(),
				isAdmin          : req.user.role == 'admin' ? true : '',
				fullHost         : req.protocol+'://'+req.hostname
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
					res.out('ideas/list', true, result);
				})
				.catch(next);
		});
	
	// View idea
	// ---------
	var router = express.Router();
	app.use('(/idea|/plan)', router);
	
	router.route('/:ideaId(\\d+)')
	// some instance do not use the /idea/:id page but show the idea in the list only
	// admins still need access vfor updates etc
		.all(function( req, res, next ) {
			if (config.ideas.onlyAdminsCanViewIdeaPage && req.user.role != 'admin') {
				return res.redirect('/ideas');
			} else {
				return next();
			}
		})
		.all(function( req, res, next ) {
			// To be able to pass the user ID to the `withArguments` scope,
			// we need to manually call the middleware created by `fetchIdea`.
			// 
			// Calling the `withArguments` scope as a method results in the field
			// `hasUserVoted` being added to the results. This field is used to
			// visualize whether a user has voted for an argument.
			// 
			// In other routes this scope is not called as a method. In these cases
			// the `hasUserVoted` field is omitted from the results.
			var middleware = fetchIdea(
				'withUser',
				'withVoteCount',
				'withPosterImage',
				{method: ['withArguments', req.user.id]}
			);
			middleware(req, res, next);
		})
		.all(fetchVoteForUser)
		.all(auth.can('idea:view', 'idea:*', 'user:mail'))
		.get(function( req, res, next) {
			db.Meeting.getSelectable(req.idea)
				.then(function( meetings ) {
					var data = {
						runningIdeas     : db.Idea.getRunning(),
						config             : config,
						idea               : req.idea,
						userVote           : req.vote,
						selectableMeetings : meetings,
						csrfToken          : req.csrfToken()
					}
					Promise.props(data)
						.then(function( result ) {
							res.out('ideas/idea', true, result);
						})
						.catch(next);
				})
				.catch(next);
		});
	
};

// Asset fetching
// --------------

function fetchIdea( /* [scopes] */ ) {
	var scopes = Array.from(arguments);
	
	return function( req, res, next ) {
		var ideaId = req.params.ideaId;
		db.Idea.scope(scopes).findById(ideaId)
			.then(function( idea ) {
				if( !idea ) {
					next(createError(404, 'Plan niet gevonden'));
				} else {
					req.idea = idea;
					if (scopes.find(element => element == 'withVoteCount')) {
						// add ranking
						db.Idea.getRunning()
							.then(rankedIdeas => {
								rankedIdeas.forEach((rankedIdea) => {
									if (rankedIdea.id == idea.id) {
										idea.ranking = rankedIdea.ranking;
									}
								});
							})
							.then(ideas => {
								next();
							})
					} else {
						next();
					}
				}
			})
			.catch(next);
	}
}
function fetchVote( req, res, next ) {
	var voteId = req.params.voteId;
	db.Vote.findById(voteId)
		.then(function( vote ) {
			if( vote ) {
				req.vote = vote;
			}
			next();
		})
		.catch(next);
}
function fetchVoteForUser( req, res, next ) {
	var user = req.user;
	var idea = req.idea;
	
	if( !user.isUnknown() && idea ) {
		idea.getUserVote(user)
			.then(function( vote ) {
				if( vote ) {
					req.vote = vote;
				}
				next();
			})
			.catch(next);
	} else {
		next();
	}
}
function fetchArgument( req, res, next ) {
	// HACK: Mixing `req.params` and req.body`? Really? B-E-A-utiful...
	var argId = req.params.argId || req.body.parentId;
	db.Argument.findById(argId)
		.then(function( argument ) {
			if( !argument ) {
				next(createError(404, 'Argument niet gevonden'));
			} else {
				req.argument = argument;
				next();
			}
		})
		.catch(next);
}

