module.exports = function( auth ) {
	auth.role('idea.owner', function( idea, req, done ) {
		done(null, idea.userId == req.session.userId);
	});
};