var express     = require('express')
  , createError = require('http-errors')
var db          = require('../db');
var auth        = require('../auth');

module.exports = function( app ) {
	// Idea index page
	// ---------------
	app.get('/ideas', auth.can('ideas:view'), function( req, res, next ) {
		db.Idea.getRunningIdeas()
		.then(function( ideas ) {
			res.format({
				html: function() {
					res.render('ideas/list', {ideas: ideas});
				},
				json: function() {
					res.json({ideas: ideas});
				}
			});
		})
		.catch(next);
	});
	
	// Single idea
	// -----------
	var router = express.Router();
	app.use('/idea', router);
	
	router.route('/:id(\\d+)')
	.all(fetchIdea)
	.all(auth.can('idea:view'))
	.get(function( req, res ) {
		var idea = req.resource;
		res.format({
			html: function() {
				res.render('ideas/idea', idea.get());
			},
			json: function() {
				res.json(idea.get());
			}
		});
	});
	
	router.route('/new')
	.all(auth.can('idea:create'))
	.get(function( req, res, next ) {
		res.format({
			html: function() {
				res.render('ideas/new', {csrfToken: req.csrfToken()});
			},
			json: function() {
				next(createError(406));
			}
		})
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