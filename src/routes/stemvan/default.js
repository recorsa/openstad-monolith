var Promise = require('bluebird');

var db      = require('../../db');
var auth    = require('../../auth');

module.exports = function( app ) {
	app.route('/')
	.all(auth.can('article:create', true))
	.get(function( req, res, next ) {
		var user = req.user;
		var data = {
			articles         : db.Article.getTilesForUser(user),
			highlightedIdeas : db.Idea.getHighlighted(),
			runningIdeas     : db.Idea.getRunning(),
			upcomingMeetings : db.Meeting.getUpcoming(),
		};
		
		Promise.props(data)
		.then(function( data ) {
			res.out('index', true, data);
		})
		.catch(next);
	});
};
