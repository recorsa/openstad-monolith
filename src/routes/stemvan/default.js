var Promise = require('bluebird');
var db      = require('../../db');

module.exports = function( app ) {
	app.route('/')
	.get(function( req, res, next ) {
		var user = req.user;
		var data = {
			articles         : db.Article.getTilesForUser(user),
			highlightedIdeas : db.Idea.getHighlighted(),
			upcomingMeetings : db.Meeting.getUpcoming(3)
		};
		
		Promise.props(data)
		.then(function( data ) {
			res.out('index', true, data);
		})
		.catch(next);
	});
};
