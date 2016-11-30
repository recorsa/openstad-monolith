var express     = require('express')
  , createError = require('http-errors')
var db          = require('../db');
var auth        = require('../auth');

module.exports = function( app ) {
	// Idea index page
	// ---------------
	app.get('/ideas', auth.can('ideas:list'), function( req, res, next ) {
		db.Idea.getRunningIdeas()
		.then(function( ideas ) {
			res.out('ideas/list', true, {
				ideas: ideas
			});
		})
		.catch(next);
	});
	
	// Single idea
	// -----------
	var router = express.Router();
	app.use('/idea', router);
	
	router.route('/:id(\\d+)')
	.all(auth.can('idea:view'))
	.all(fetchIdea)
	.get(function( req, res ) {
		var idea = req.resource;
		res.out('ideas/idea', true, {
			idea: idea.get()
		});
	});
	
	router.route('/new')
	.all(auth.can('idea:create'))
	.get(function( req, res ) {
		res.out('ideas/new', false, {
			csrfToken: req.csrfToken()
		});
	})
	.post(function( req, res, next ) {
		db.Idea.createNew(req.body)
		.then(function( idea ) {
			res.format({
				html: function() {
					res.redirect('/idea/'+idea.id);
				},
				json: function() {
					res.json({idea: idea});
				}
			});
		})
		.catch(next)
	});
};

function fetchIdea( req, res, next ) {
	var ideaId = req.params.id;
	if( !ideaId ) {
		return next();
	}
	
	db.Idea.findById(ideaId).then(function( idea ) {
		if( !idea ) {
			next(createError(404, 'Idea not found'));
		} else {
			req.resource = idea;
			next();
		}
	});
}