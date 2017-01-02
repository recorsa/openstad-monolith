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
		var queries = {
			runningIdeas     : db.Idea.getRunning(),
			highlightedIdeas : db.Idea.getHighlighted(),
			upcomingMeetings : db.Meeting.getUpcoming(3)
		};
		if( req.can('idea:admin') ) {
			queries['historicIdeas'] = db.Idea.getHistoric();
		}
		
		Promise.props(queries)
		.then(function( result ) {
			res.out('ideas/list', true, result);
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
	// Also functions as anonymous registration by zipcode. When a user
	// is not authorized to vote, a zipcode registration form is shown
	// via the POST error handler. After the user submits his zipcode,
	// a new anonymous member is created, and the normal POST handler
	// is called.
	router.route('/:ideaId/vote')
	.all(fetchIdea())
	.all(auth.can('idea:vote'))
	.post(function( err, req, res, next ) {
		if( err.status != 403 || !req.idea.isOpen() ) {
			return next(err);
		}
		
		var zipCode = req.body.zipCode;
		if( !zipCode ) {
			res.format({
				html: function() {
					res.render('ideas/enter_zipcode', {
						csrfToken : req.csrfToken(),
						opinion   : getOpinion(req)
					});
				},
				json: function() {
					next(err);
				}
			});
		} else {
			// Register a new anonymous member and continue with the normal request.
			var uidProperty = config.get('security.sessions.uidProperty');
			db.User.registerAnonymous(zipCode)
			.then(function( newUser ) {
				req.session[uidProperty] = newUser.id;
				req.user = newUser;
				next();
			});
		}
	})
	.post(function( req, res, next ) {
		var user    = req.user;
		var idea    = req.idea;
		var opinion = getOpinion(req);
		
		idea.addUserVote(user, opinion, req.ip)
		.then(function( voteRemoved ) {
			req.flash('success', !voteRemoved ? 'U heeft gestemd' : 'Uw stem is ingetrokken');
			res.success('/idea/'+idea.id, function json() {
				return db.Idea.scope('withVotes').findById(idea.id)
				.then(function( idea ) {
					return {idea: idea};
				});
			});
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
			req.flash('success', 'Argument toegevoegd');
			res.success('/idea/'+idea.id, function json() {
				return {
					argument : argument.toJSON()
				};
			});
		})
		.catch(next);
	});
	
	router.route('/:ideaId/arg/:argId/edit')
	.all(fetchIdea(), fetchArgument)
	.all(auth.can('arg:edit'))
	.get(function( req, res, next ) {
		res.format({
			html: function() {
				res.out('ideas/form_arg', true, {
					argument  : req.argument,
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
			req.flash('success', 'Argument aangepast');
			res.success('/idea/'+argument.ideaId, function json() {
				return {
					argument : argument.toJSON()
				};
			});
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
			req.flash('success', 'Argument verwijderd');
			res.success('/idea/'+ideaId);
		})
		.catch(next);
	});
	
	// Admin idea
	// ----------
	router.route('/:ideaId/status')
	.all(fetchIdea('withVotes'))
	.all(auth.can('idea:admin'))
	.put(function( req, res, next ) {
		var idea = req.idea;
		idea.setStatus(req.body.status)
		.then(function() {
			res.success('/idea/'+idea.id, {idea: idea});
		})
		.catch(next);
	});
	router.route('/:ideaId/mod_break')
	.all(fetchIdea())
	.all(auth.can('idea:admin'))
	.get(function( req, res, next ) {
		res.out('ideas/form_mod_break', true, {
			idea      : req.idea,
			csrfToken : req.csrfToken()
		});
	})
	.put(function( req, res, next ) {
		var idea = req.idea;
		idea.setModBreak(req.body.modBreak)
		.then(function() {
			res.success('/idea/'+idea.id, {idea: idea});
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

function getOpinion( req ) {
	var opinion = req.body.opinion;
	// Fallback to support mutiple submit buttons with the opinion's
	// value as name.
	// e.g.: `<input type="submit" name="abstain" value="Neutral">`.
	if( !opinion ) {
		opinion = 'no'      in req.body ? 'no' :
		          'yes'     in req.body ? 'yes' :
		          'abstain' in req.body ? 'abstain' :
		                                  undefined;
	}
	return opinion;
}