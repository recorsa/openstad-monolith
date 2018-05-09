var Promise = require('bluebird');
var db      = require('../../db');

module.exports = function( app ) {
	app.get('/', function( req, res, next ) {
    var articles = db.Article.getTiles().filter(function( article ) {
    	return article.isPublished == true ||
    	       req.user && req.user.can('article:edit', article);
    });
    var data = {
			articles         : articles,
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
