var auth = require('authorized');

module.exports = function( app ) {
	app.get('/idea/:ideaId', auth.can('view idea'), function( req, res ) {
		var view = auth.view(req)
		  , idea = view.get('idea');
		res.send('<h1>Idea: '+idea.title+'</h1>');
	});
}