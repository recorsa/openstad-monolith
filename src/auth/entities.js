var db     = require('../db')
  , errors = require('../errors');

module.exports = function( auth ) {
	auth.entity('idea', function( req, done ) {
		var ideaId = req.params.ideaId;
		db.Idea.findById(ideaId).then(function( idea ) {
			if( !idea ) {
				done(new errors.NotFoundError());
			} else {
				done(null, idea);
			}
		});
	});
};