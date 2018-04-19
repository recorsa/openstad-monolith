var config       = require('config')
var createError  = require('http-errors')
var Promise      = require('bluebird');
var db           = require('../../db')
var auth         = require('../../auth')

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
		.post(updateUserSession)
		.post(function( req, res, next ) {
			var {body, user, idea} = req;

			// in case nickname is already set to user add it to the body
			if (user.nickName) {
				body.nickName = user.nickName;
			}

			if( !user.zipCode ) {
				throw createError(403, 'Geen postcode ingevuld');
			}

			if( !body.nickName ) {
				throw createError(400, 'Geen naam opgegeven');
			}

			idea.addUserArgument(user, body)
			.then(function( argument ) {
				req.flash('success', 'Bedankt voor je reactie');
				res.success(`/#arg${argument.id}`, {argument});
			})
			.catch(next);
		})
		.all(createArgumentError);

		// Reply to argument.
		app.route('/arg/reply')
		.all(fetchIdea())
		.all(fetchArgument)
		.all(auth.can('arg:reply'))
		.post(updateUserSession)
		.post(function( req, res, next ) {
			var {body, user, idea} = req;

			if( !body.nickName ) {
				throw createError(400, 'Geen naam opgegeven');
			}

			idea.addUserArgument(user, body)
			.then(function( argument ) {
				req.flash('success', 'Bedankt voor je reactie');
				res.success(`/#arg${argument.id}`, {argument});
			})
			.catch(next);
		})
		.all(createArgumentError);

		// Shared error handler.
		function createArgumentError( err, req, res, next ) {
			if( err instanceof db.sequelize.ValidationError ) {
				var error = err.errors.length ?
				            Error(err.errors[0].message) :
				            Error(err.message);
				error.status = 400;
				next(error);
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
		res.out('form_arg', false, {
			argument  : req.argument,
			csrfToken : req.csrfToken()
		});
	})
	.put(function( req, res, next ) {
		var {user, argument} = req;
		var description      = req.body.description;

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
			res.out('form_arg', false, {
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
	.get(function( req, res, next ) {
		res.out('form_arg_vote', false, {
			argument  : req.argument,
			csrfToken : req.csrfToken()
		});
	})
	.post(updateUserSession)
	.post(function( req, res, next ) {
		var {user, argument, ip} = req;

		if( !user.zipCode ) {
			throw createError(403, 'Geen postcode ingevuld');
		}

		argument.addUserVote(user, 'yes', ip)
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
	// .all(function( err, req, res, next ) {
	// 	if( err.status == 403 && req.accepts('html') ) {
	// 		var ideaId = req.params.ideaId;
	// 		var argId  = req.params.argId;
	// 		req.flash('error', err.message);
	// 		res.success(`/account/register?ref=/plan/${ideaId}#arg${argId}`);
	// 	} else {
	// 		next(err);
	// 	}
	// });
};

// Helper functions
// ----------------

function fetchIdea( ...scopes ) {
	return function( req, res, next ) {
		db.Idea.scope(scopes).findById(1)
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
	// HACK: Mixing `req.params` and `req.body`? Really? B-E-A-utiful...
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

// `updateUserSession` assure for both adding arguments/replies
// that the user performing the action has an anonymous profile
// with a `nickName`. This middleware is only relevant on POSt
// requests.
function updateUserSession( req, res, next ) {
	var {user, body} = req;

	// 1. Register/pass anonymous user.
	// 2. Update `nickName`.
	// 3. Update session ('login').
	(
		user.isAnonymous() ?
		Promise.resolve(user) :
		db.User.registerAnonymous(null)
	)
	.tap(function( user ) {
		if( body.nickName || body.zipCode ) {
			var data = {};
			if( body.nickName ) data.nickName = body.nickName;
			if( body.zipCode )  data.zipCode  = body.zipCode;
			return user.update(data);
		}
	})
	.then(function( user ) {
		req.setSessionUser(user.id);
		req.user = user;
		next();
	})
	.catch(next);
}
