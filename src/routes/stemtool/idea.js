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
	// Idea index page
	// ---------------
	app.route('(/ideas|/plannen)')
	.all(auth.can('ideas:list', 'ideas:archive', 'idea:create'))
	.get(function( req, res, next ) {
		// Figure out idea sorting, and store in the user's session.
		var sort = (req.query.sort || '').replace(/[^a-z_]+/i, '') ||
		           req.cookies['idea_sort'];
		if( sort ) {
			res.cookie('idea_sort', sort, {
				expires: 0
			});
		}

		var data = {
			sort             : sort,
			runningIdeas     : db.Idea.getRunning(sort),
			highlightedIdeas : db.Idea.getHighlighted(),
			upcomingMeetings : db.Meeting.getUpcoming(3)
		};

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
      'withVotedUsers',
			'withPosterImage',
			{method: ['withArguments', req.user.id]}
		);
		middleware(req, res, next);
	})
	.all(fetchVoteForUser)
	.all(auth.can('idea:view', 'idea:*', 'user:mail'))
	.get(function( req, res, next) {
		res.out('ideas/idea', true, {
			idea      : req.idea,
			userVote  : req.vote,
			csrfToken : req.csrfToken()
		});
	});

	// Create idea
	// -----------
	router.route('(/new|/nieuw)')
	.all(auth.can('idea:create', true))
	.get(function( req, res ) {
		var help = req.query.help;
		res.out('ideas/form', false, {
			showHelp        : help != undefined ? !!Number(help) : true,
			showForm        : req.can('idea:create'),
			useModernEditor : isModernBrowser(req),
			csrfToken       : req.csrfToken()
		});
	})
	.post(function( req, res, next ) {
		req.body.location = JSON.parse(req.body.location || null);

		req.user.createNewIdea(req.body)
		.then(function( idea ) {
			sendThankYouMail(req, idea);
			res.success('/plan/'+idea.id, {idea: idea});
		})
		.catch(function( error ) {
			if( error instanceof db.sequelize.ValidationError ) {
				error.errors.forEach(function( error ) {
					req.flash('error', error.message);
				});
				res.out('ideas/form', false, {
					showForm        : true,
					useModernEditor : isModernBrowser(req),
					idea            : req.body,
					csrfToken       : req.csrfToken()
				});
			} else {
				next(error);
			}
		});
	});

	// Edit idea
	// ---------
	router.route('/:ideaId/edit')
	.all(fetchIdea('withVoteCount', 'withPosterImage', 'withArguments'))
	.all(auth.can('idea:edit'))
	.get(function( req, res, next ) {
		res.out('ideas/form', false, {
			showHelp        : false,
			showForm        : true,
			useModernEditor : isModernBrowser(req),
			idea            : req.idea,
			csrfToken       : req.csrfToken()
		});
	})
	.put(function( req, res, next ) {
		req.body.location = JSON.parse(req.body.location || null);

		req.user.updateIdea(req.idea, req.body)
		.then(function( idea ) {
			res.success('/plan/'+idea.id, {idea: idea});
		})
		.catch(function( error ) {
			if( error instanceof db.sequelize.ValidationError ) {
				error.errors.forEach(function( error ) {
					req.flash('error', error.message);
				});
				res.out('ideas/form', false, {
					showForm        : true,
					useModernEditor : isModernBrowser(req),
					idea            : req.idea,
					csrfToken       : req.csrfToken()
				});
			} else {
				next(error);
			}
		});
	});

	// Delete idea
	// -----------
	router.route('/:ideaId/delete')
	.all(fetchIdea('withVoteCount', 'withArguments'))
	.all(auth.can('idea:delete'))
	.delete(function( req, res, next ) {
		var idea = req.idea;
		idea.destroy()
		.then(function() {
			req.flash('success', 'Je idee is verwijderd');
			res.success('/plannen', true);
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

		var zipCode        = req.body.zipCode;
		var newUserCreated = false;

		if( zipCode ) {
			// Register a new anonymous member and continue with the normal request.
			newUserCreated = db.User.registerAnonymous(zipCode)
			.then(function( newUser ) {
				req.setSessionUser(newUser.id);
				req.user = newUser;
				next();
				return true;
			})
			.catch(function( error ) {
				if( error instanceof db.sequelize.ValidationError ) {
					error.errors.forEach(function( error ) {
						req.flash('error', error.message);
					});
					return false;
				} else {
					next(error);
				}
			});
		}

		Promise.resolve(newUserCreated)
		.then(function( newUserCreated ) {
			if( newUserCreated ) return;

			res.format({
				html: function() {
					res.out('ideas/enter_zipcode', false, {
						csrfToken : req.csrfToken(),
						opinion   : getOpinion(req),
						zipCode   : zipCode
					});
				},
				json: function() {
					next(err);
				}
			});
		})
		.catch(next);
	})
	.post(function( req, res, next ) {
		var user    = req.user;
		var idea    = req.idea;
		var opinion = getOpinion(req);

		idea.addUserVote(user, opinion, req.ip)
		.then(function( voteRemoved ) {
			req.flash('success', !voteRemoved ? 'U heeft gestemd' : 'Uw stem is ingetrokken');
			res.success('/plan/'+idea.id, function json() {
				return db.Idea.scope('withVoteCount').findById(idea.id)
				.then(function( idea ) {
					return {idea: idea};
				});
			});
		})
		.catch(next);
	});

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
		router.route('/:ideaId/arg/new')
		.all(fetchIdea())
		.all(auth.can('arg:add'))
		.post(function( req, res, next ) {
			var idea = req.idea;
			idea.addUserArgument(req.user, req.body)
			.then(function( argument ) {
				req.flash('success', 'Argument toegevoegd');
				res.success(`/plan/${idea.id}#arg${argument.id}`, {
					argument: argument
				});
			})
			.catch(next);
		})
		.all(createArgumentError);

		// Reply to argument.
		router.route('/:ideaId/arg/reply')
		.all(fetchIdea())
		.all(fetchArgument)
		.all(auth.can('arg:reply'))
		.post(function( req, res, next ) {
			var idea = req.idea;
			idea.addUserArgument(req.user, req.body)
			.then(function( argument ) {
				req.flash('success', 'Reactie toegevoegd');
				res.success(`/plan/${idea.id}#arg${argument.id}`, {
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
	router.route('/:ideaId/arg/:argId/edit')
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
			res.success(`/plan/${argument.ideaId}#arg${argument.id}`, {
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
	router.route('/:ideaId/arg/:argId/delete')
	.all(fetchIdea())
	.all(fetchArgument)
	.all(auth.can('arg:delete'))
	.delete(function( req, res, next ) {
		var argument = req.argument;
		var ideaId   = argument.ideaId;
		argument.destroy()
		.then(function() {
			req.flash('success', 'Argument verwijderd');
			res.success('/plan/'+ideaId);
		})
		.catch(next);
	});

	// Vote for argument
	// -----------------
	router.route('/:ideaId/arg/:argId/vote')
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
			res.success(`/plan/${idea.id}#arg${argument.id}`, function json() {
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

	// Admin: change idea status
	// -------------------------
	router.route('/:ideaId/status')
	.all(fetchIdea('withVoteCount'))
	.all(auth.can('idea:admin'))
	.put(function( req, res, next ) {
		var idea = req.idea;
		idea.setStatus(req.body.status)
		.then(function() {
			res.success('/plan/'+idea.id, {idea: idea});
		})
		.catch(next);
	});

	// Admin: change mod break
	// -----------------------
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
		idea.setModBreak(req.user, req.body.modBreak)
		.then(function() {
			res.success('/plan/'+idea.id, {idea: idea});
		})
		.catch(next);
	});

	// Admin: view votes
	// -----------------
	router.route('/:ideaId/votes')
	.all(fetchIdea('withVotes'))
  .all(fetchPoll)
	.all(auth.can('idea:admin'))
	.get(function( req, res, next ) {
		var asDownload = 'download' in req.query;
		var idea       = req.idea;
    var poll       = req.poll;

    console.log('-------- poll', poll);

		if( !asDownload ) {
			// Display votes as interactive table.
			res.out('ideas/idea_votes', true, {
				idea : idea,
        poll : req.poll,
			});
		} else {
			var votes_JSON = idea.votes.map(function( vote ) {
				return vote.toJSON();
			});
			// Download votes as CSV.
			csvStringify(votes_JSON, {
				header     : true,
				delimiter  : ';',
				quoted     : true,
				columns    : {
					'user.id'      : 'userId',
					'user.zipCode' : 'zipCode',
					'ip'           : 'ip',
					'opinion'      : 'opinion',
					'createdAt'    : 'createdAt'
				},
				formatters : {
					date: function( value ) {
						return moment(value)
						       .tz(config.get('timeZone'))
						       .format('YYYY-MM-DD HH:mm:ss');
					}
				}
			}).then(function( csvText ) {
				res.type('text/csv');
				res.set('Content-disposition', 'attachment; filename=Stemoverzicht plan '+req.idea.id+'.csv');
				res.send(csvText);
			});
		}
	});

	// Admin: toggle vote status
	// -------------------------
	router.route('/:ideaId/vote/:voteId/toggle_checked')
	.all(fetchVote)
	.all(auth.can('idea:admin'))
	.get(function( req, res, next ) {
		var ideaId = req.params.ideaId;
		var vote   = req.vote;

		vote.toggle()
		.then(function() {
			res.success('/plan/'+ideaId+'/votes', {vote: vote});
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
				next();
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

// Helper functions
// ----------------

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
// Used to check if Trix editor is supported.
// - Android >= 4.4
// - Firefox >= 48
// - Chrome >= 53
// - IE >= 11
// - Edge
// - Safari >= 8
// - iPhone >= 8.4
function isModernBrowser( req ) {
	var agent = util.userAgent(req.get('user-agent'));

	// console.log(agent);
	switch( agent.family.toLowerCase() ) {
		case 'android':
			return agent.satisfies('>= 4.4');
		case 'firefox':
			return agent.satisfies('>= 48');
		case 'chrome':
			return agent.satisfies('>= 53');
		case 'ie':
			return agent.satisfies('>= 11');
		case 'edge':
			return true;
		case 'safari':
			return agent.satisfies('>= 8');
		case 'mobile safari':
			return agent.satisfies('>= 8.4');
		default:
			return false;
	}
}

function sendThankYouMail( req, idea ) {
	var data    = {
		date     : new Date(),
		user     : req.user,
		idea     : idea,
		fullHost : req.protocol+'://'+req.hostname
	};
	var html = nunjucks.render('email/idea_created.njk', data);
	var text = htmlToText.fromString(html, {
		ignoreImage              : true,
		hideLinkHrefIfSameAsText : true,
		uppercaseHeadings        : false
	});

	mail.sendMail({
		to          : req.user.email,
		subject     : 'Bedankt voor je voorstel',
		html        : html,
		text        : text,
		attachments : [{
			filename : 'logo@2x.png',
			path     : 'img/email/logo@2x.png',
			cid      : 'logo'
		}, {
			filename : 'map@2x.png',
			path     : 'img/email/map@2x.png',
			cid      : 'map'
		}, {
			filename : 'steps@2x.png',
			path     : 'img/email/steps@2x.png',
			cid      : 'steps'
		}]
	});
}

function fetchPoll( req, res, next ) {
	var {user, idea} = req;
	var ideaId       = idea.id;
	if( !ideaId ) {
		throw createError(400, 'Geen ideaId');
	}

	db.PollVote.scope().findAll({
    // attributes: ['foo', 'bar'],
		where: {
			ideaId: ideaId
		}
	})
	.then(function( votes ) {
		if( !votes ) {
			throw createError(404, 'Poll votes niet gevonden');
		}

    console.log('votes', votes);
		req.pollVotes = votes;
		next();
	})
	.catch(next);
}
