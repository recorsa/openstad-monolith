var config      = require('config')
  , createError = require('http-errors')
  , express     = require('express')
  , Promise     = require('bluebird');
var db          = require('../db');
var auth        = require('../auth');

module.exports = function( app ) {
	// Idea index page
	// ---------------
	app.route('/ideas')
	.all(auth.can('ideas:list', 'idea:create', 'idea:admin'))
	.get(function( req, res, next ) {
		var queries = [db.Idea.getRunningIdeas()];
		if( req.can('idea:admin') ) {
			queries.push(db.Idea.getHistoricIdeas());
		}
		
		Promise.all(queries).then(function( queries ) {
			res.out('ideas/list', true, {
				runningIdeas  : queries[0],
				historicIdeas : queries[1]
			});
		})
		.catch(next);
	});
	
	// View idea
	// ---------
	var router = express.Router();
	app.use('/idea', router);
	
	router.route('/:ideaId(\\d+)')
	.all(fetchIdea('withUser', 'withVotes', 'withArguments'))
	.all(auth.can('idea:view', 'idea:*', 'arg:add'))
	.get(function( req, res ) {
		var idea = req.idea;
		res.out('ideas/idea', true, {
			idea      : idea,
			csrfToken : req.csrfToken()
		});
	});
	
	// Create idea
	// -----------
	router.route('/new')
	.all(auth.can('idea:create'))
	.get(function( req, res ) {
		res.out('ideas/form', false, {
			csrfToken: req.csrfToken()
		});
	})
	.post(function( req, res, next ) {
		req.user.createNewIdea(req.body)
		.then(function( idea ) {
			res.success('/idea/'+idea.id, {idea: idea.toJSON()});
		})
		.catch(next)
	});
	
	// Edit idea
	// ---------
	router.route('/:ideaId/edit')
	.all(fetchIdea('withVotes', 'withArguments'))
	.all(auth.can('idea:edit'))
	.get(function( req, res, next ) {
		res.out('ideas/form', false, {
			idea      : req.idea,
			csrfToken : req.csrfToken()
		});
	})
	.put(function( req, res, next ) {
		req.user.updateIdea(req.idea, req.body)
		.then(function( idea ) {
			res.success('/idea/'+idea.id, {idea: idea.toJSON()});
		})
		.catch(next);
	});
	
	// Delete idea
	// -----------
	router.route('/:ideaId/delete')
	.all(fetchIdea('withVotes', 'withArguments'))
	.all(auth.can('idea:delete'))
	.delete(function( req, res, next ) {
		var idea = req.idea;
		idea.destroy()
		.then(function() {
			res.success('/ideas', true);
		})
		.catch(next);
	});
	
	// Vote for idea
	// -------------
	router.route('/:ideaId/vote')
	.all(fetchIdea())
	.post(function( req, res, next ) {
		var idea    = req.idea;
		var opinion = req.body.opinion;
		var zipCode = req.body.zipCode;
		// Fallback to support mutiple submit buttons with the opinion's
		// value as name.
		// e.g.: `<input type="submit" name="abstain" value="Neutral">`.
		if( !opinion ) {
			opinion = 'no'      in req.body ? 'no' :
			          'yes'     in req.body ? 'yes' :
			          'abstain' in req.body ? 'abstain' :
			                                  undefined;
		}
		
		Promise.resolve(zipCode)
		.then(function findOrCreateUser( zipCode ) {
			if( req.user.isLoggedIn() || !zipCode ) {
				return req.user;
			} else {
				var uidProperty = config.get('security.sessions.uidProperty');
				return db.User.registerAnonymous(zipCode)
				.then(function( newUser ) {
					req.session[uidProperty] = newUser.id;
					return newUser;
				});
			}
		})
		.then(function checkPermissions( user ) {
			return [user, auth.user(user).can('idea:vote', idea)];
		})
		.spread(function voteOrRegister( user, mayVote ) {
			if( mayVote ) {
				return idea.addUserVote(user, opinion)
				.then(function() {
					res.success('/idea/'+idea.id, true);
				});
			} else {
				res.format({
					html: function() {
						res.render('ideas/enter_zipcode', {
							csrfToken : req.csrfToken(),
							opinion   : opinion
						});
					},
					json: function() {
						throw createError(403);
					}
				});
			}
		})
		.catch(next);
	});
	
	// Argumentation
	// -------------
	router.route('/:ideaId/arg/new')
	.all(fetchIdea())
	.all(auth.can('arg:add'))
	.post(function( req, res, next ) {
		var idea = req.idea;
		idea.addUserArgument(req.user, req.body)
		.then(function( argument ) {
			res.success('/idea/'+idea.id, {argument: argument.toJSON()});
		})
		.catch(next);
	});
	
	router.route('/:ideaId/arg/:argId/edit')
	.all(fetchArgument)
	.all(auth.can('arg:edit'))
	.get(function( req, res, next ) {
		res.format({
			html: function() {
				res.out('ideas/form_arg.njk', true, {
					argument  : req.argument.toJSON(),
					csrfToken : req.csrfToken()
				});
			},
			json: function() {
				next(createError(406));
			}
		})
	})
	.put(function( req, res, next ) {
		var argument = req.argument;
		argument.update({
			description: req.body.description
		})
		.then(function() {
			res.success('/idea/'+argument.ideaId, {argument: argument.toJSON()});
		})
		.catch(next);
	});
	
	router.route('/:ideaId/arg/:argId/delete')
	.all(fetchArgument)
	.all(auth.can('arg:delete'))
	.delete(function( req, res, next ) {
		var argument = req.argument;
		var ideaId   = argument.ideaId;
		argument.destroy()
		.then(function() {
			res.success('/idea/'+ideaId, true);
		})
		.catch(next);
	});
	
	// Admin idea
	// ----------
	router.route('/:ideaId/status')
	.all(fetchIdea())
	.all(auth.can('idea:admin'))
	.put(function( req, res, next ) {
		var idea = req.idea;
		idea.setStatus(req.body.status)
		.then(function() {
			res.success('/idea/'+idea.id, {idea: idea.toJSON()});
		})
		.catch(next);
	});
};

function fetchIdea( /* [scopes] */ ) {
	var scopes = Array.from(arguments);
	
	return function( req, res, next ) {
		var ideaId = req.params.ideaId;
		db.Idea.scope(scopes).findById(ideaId)
		.then(function( idea ) {
			if( !idea ) {
				next(createError(404, 'Idea not found'));
			} else {
				req.idea = idea;
				next();
			}
		})
		.catch(next);
	}
}
function fetchArgument( req, res, next ) {
	var argId = req.params.argId;
	db.Argument.findById(argId)
	.then(function( argument ) {
		if( !argument ) {
			next(createError(404, 'Argument not found'));
		} else {
			req.argument = argument;
			next();
		}
	})
	.catch(next);
}