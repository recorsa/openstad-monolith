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
  , mail         = require('../../mail');

module.exports = function( app ) {
	// Create argument
	// ---------------
	// Creating a new argument can be done two ways:
	// 1. Add a new argument to the idea.
	// 2. Reply to an existing argument.
	// 
	// Both methods share a lot of common ground, but differ in their
	// authorization logic and an extra data field: `parentId`.
	// 
	// That's why argument creation logic is split into 2 routes, with
	// a shared error handler.
	(function() {
		// New argument.
		app.route('/arg/new')
		.all(fetchIdea())
		.all(auth.can('arg:add'))
		.post(function( req, res, next ) {
			var idea = req.idea;
			idea.addUserArgument(req.user, req.body)
			.then(function( argument ) {
				req.flash('success', 'Argument toegevoegd');
				res.success(`/#arg${argument.id}`, {
					argument: argument
				});
			})
			.catch(next);
		})
		.all(createArgumentError);
		
		// Reply to argument.
		app.route('/arg/reply')
		.all(fetchIdea())
		.all(fetchArgument)
		.all(auth.can('arg:reply'))
		.post(function( req, res, next ) {
			var idea = req.idea;
			idea.addUserArgument(req.user, req.body)
			.then(function( argument ) {
				req.flash('success', 'Reactie toegevoegd');
				res.success(`/#arg${argument.id}`, {
					argument: argument
				});
			})
			.catch(next);
		})
		.all(createArgumentError);
		
		// Shared error handler.
		function createArgumentError( err, req, res, next ) {
			if( err.status == 403 && req.accepts('html') ) {
				var ideaId = req.params.ideaId;
				req.flash('error', err.message);
				res.success(`/account/register?ref=/plan/${ideaId}`);
			} else if( err instanceof db.sequelize.ValidationError ) {
				err.errors.forEach(function( error ) {
					req.flash('error', error.message);
				});
				next(createError(400));
			} else {
				next(err);
			}
		}
	})();
	
	// Edit argument
	// -------------
	app.route('/arg/:argId/edit')
	.all(fetchIdea())
	.all(fetchArgument)
	.all(auth.can('arg:edit'))
	.get(function( req, res, next ) {
		res.out('ideas/form_arg', false, {
			argument  : req.argument,
			csrfToken : req.csrfToken()
		});
	})
	.put(function( req, res, next ) {
		var user        = req.user;
		var argument    = req.argument;
		var description = req.body.description;
		
		req.idea.updateUserArgument(user, argument, description)
		.then(function( argument ) {
			var flashMessage = argument.parentId ?
			                   'Reactie aangepast' :
			                   'Argument aangepast';
			
			req.flash('success', flashMessage);
			res.success(`/#arg${argument.id}`, {
				argument: argument
			});
		})
		.catch(db.sequelize.ValidationError, function( err ) {
			err.errors.forEach(function( error ) {
				req.flash('error', error.message);
			});
			res.out('ideas/form_arg', false, {
				argument  : req.argument,
				csrfToken : req.csrfToken()
			});
		})
		.catch(next);
	});
	
	// Delete argument
	// ---------------
	app.route('/arg/:argId/delete')
	.all(fetchIdea())
	.all(fetchArgument)
	.all(auth.can('arg:delete'))
	.delete(function( req, res, next ) {
		var argument = req.argument;
		var ideaId   = argument.ideaId;
		argument.destroy()
		.then(function() {
			req.flash('success', 'Argument verwijderd');
			res.success('/');
		})
		.catch(next);
	});
	
	// Vote for argument
	// -----------------
	app.route('/arg/:argId/vote')
	.all(fetchIdea())
	.all(fetchArgument)
	.all(auth.can('arg:vote'))
	.post(function( req, res, next ) {
		var user     = req.user;
		var argument = req.argument;
		var idea     = req.idea;
		var opinion  = getOpinion(req);
		
		argument.addUserVote(user, opinion, req.ip)
		.then(function( voteRemoved ) {
			var flashMessage = !voteRemoved ?
			                   'U heeft gestemd op het argument' :
			                   'Uw stem op het argument is ingetrokken';
			
			req.flash('success', flashMessage);
			res.success(`/#arg${argument.id}`, function json() {
				return db.Argument.scope(
					{method: ['withVoteCount', 'argument']},
					{method: ['withUserVote', 'argument', user.id]}
				)
				.findById(argument.id)
				.then(function( argument ) {
					return {argument: argument};
				});
			});
		})
		.catch(next);
	})
	.all(function( err, req, res, next ) {
		if( err.status == 403 && req.accepts('html') ) {
			var ideaId = req.params.ideaId;
			var argId  = req.params.argId;
			req.flash('error', err.message);
			res.success(`/account/register?ref=/plan/${ideaId}#arg${argId}`);
		} else {
			next(err);
		}
	});
};

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
				next();
			}
		})
		.catch(next);
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