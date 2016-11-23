var express = require('express');
var db      = require('../db');

module.exports = function( app ) {
	var router = express.Router();
	app.use('/ideas', router);
	
	router.get('/', function getCurrentIdeas( req, res ) {
		res.send('List ideas');
	});
	
	router.get('/:ideaId', fetchIdea, function viewIdeaDetails( req, res ) {
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