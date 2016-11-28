var express = require('express');
var db      = require('../db');
var auth    = require('../auth');
var errors  = require('../errors');

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
	
	router.all('/:ideaId', fetchIdea);
	router.get('/:ideaId', auth.can('idea:view'), function( req, res ) {
		var idea = req.resource;
		res.format({
			html: function() {
				res.render('ideas/idea.njk', idea.get());
			},
			json: function() {
				res.json(idea.get());
			}
		});
	});
};

function fetchIdea( req, res, next ) {
	var ideaId = req.params.ideaId;
	if( !ideaId ) {
		return next();
	}
	
	db.Idea.findById(ideaId).then(function( idea ) {
		if( !idea ) {
			next(new errors.NotFoundError());
		} else {
			req.resource = idea;
			next();
		}
	});
}