var express     = require('express')
  , createError = require('http-errors')
var db          = require('../db');
var auth        = require('../auth');

module.exports = function( app ) {
	// Idea index page
	// ---------------
	app.get('/ideas', auth.can('ideas:list', 'idea:create'), function( req, res, next ) {
		db.Idea.getRunningIdeas()
		.then(function( ideas ) {
			res.out('ideas/list', true, {
				ideas: ideas
			});
		})
		.catch(next);
	});
	
	// View idea
	// ---------
	var router = express.Router();
	app.use('/idea', router);
	
	router.route('/:id(\\d+)')
	.all(fetchIdea)
	.all(auth.can('idea:view', 'idea:*'))
	.get(function( req, res ) {
		var idea = req.resource;
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
	router.route('/:id(\\d+)/edit')
	.all(fetchIdea)
	.all(auth.can('idea:edit'))
	.get(function( req, res, next ) {
		res.out('ideas/form', false, {
			idea      : req.resource,
			csrfToken : req.csrfToken()
		});
	})
	.put(function( req, res, next ) {
		req.user.updateIdea(req.resource, req.body)
		.then(function( idea ) {
			res.success('/idea/'+idea.id, {idea: idea});
		})
		.catch(next);
	});
	
	// Delete idea
	// -----------
	router.route('/:id(\\d+)/delete')
	.all(fetchIdea)
	.all(auth.can('idea:delete'))
	.delete(function( req, res, next ) {
		var idea = req.resource;
		idea.destroy()
		.then(function() {
			res.success('/ideas', true);
		})
		.catch(next);
	});
	
	// Vote for idea
	// -------------
	router.route('/:id(\\d+)/vote')
	.all(fetchIdea)
	.all(auth.can('idea:vote'))
	.post(function( req, res, next ) {
		var idea    = req.resource;
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
};

function fetchIdea( req, res, next ) {
	var ideaId = req.params.id;
	db.Idea.findById(ideaId).then(function( idea ) {
		if( !idea ) {
			next(createError(404, 'Idea not found'));
		} else {
			req.resource = idea;
			next();
		}
	})
	.catch(next);
}