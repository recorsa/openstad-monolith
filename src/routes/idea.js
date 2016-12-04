var express     = require('express')
  , createError = require('http-errors')
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
	
	router.route('/:id(\\d+)')
	.all(fetchIdea('withVotes', 'withArguments'))
	.all(auth.can('idea:view', 'idea:*'))
	.get(function( req, res ) {
		var idea = req.idea;
		res.out('ideas/idea', true, {
			idea      : idea.get(),
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
			res.success('/idea/'+idea.id, {idea: idea});
		})
		.catch(next)
	});
	
	// Edit idea
	// ---------
	router.route('/:id/edit')
	.all(fetchIdea())
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
			res.success('/idea/'+idea.id, {idea: idea});
		})
		.catch(next);
	});
	
	// Delete idea
	// -----------
	router.route('/:id/delete')
	.all(fetchIdea())
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
	router.route('/:id/vote')
	.all(fetchIdea())
	.all(auth.can('idea:vote'))
	.post(function( req, res, next ) {
		var idea    = req.idea;
		var opinion = req.body.opinion;
		// Fallback to support mutiple submit buttons with the opinion's value as name.
		// e.g.: `<input type="submit" name="abstain" value="Blanco">`.
		if( !opinion ) {
			opinion = 'no'      in req.body ? 'no' :
			          'yes'     in req.body ? 'yes' :
			          'abstain' in req.body ? 'abstain' :
			                                  undefined;
		}
		
		req.user.vote(idea, opinion)
		.then(function() {
			res.success('/idea/'+idea.id, true);
		})
		.catch(next);
	});
	
	// Admin idea
	// ----------
	router.route('/:id/status')
	.all(fetchIdea())
	.all(auth.can('idea:admin'))
	.put(function( req, res, next ) {
		var idea = req.idea;
		idea.setStatus(req.body.status)
		.then(function() {
			res.success('/idea/'+idea.id, true);
		})
		.catch(next);
	});
};

function fetchIdea( /* [scopes] */ ) {
	var scopes = Array.from(arguments);
	
	return function( req, res, next ) {
		var ideaId = req.params.id;
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