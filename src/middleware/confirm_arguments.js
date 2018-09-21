var createError   = require('http-errors');
var auth          = require('../auth');
var db            = require('../db');
var notifications = require('../notifications');


module.exports = function( app ) {

	app.use('/arguments/:argId/:action', function( req, res, next ) {
		var argId = req.params.argId;
		db.Argument.findById(argId)
			.then(function( argument ) {
				if( !argument ) {
					return res.redirect('/');
				}
				if (argument.userId != req.user.id) {
					return next(createError(401))
				}
				if (req.params.action == 'confirm') {
					argument
						.update({ confirmationRequired: null })
						.then(result => {
							notifications.trigger(req.user.id, 'arg', argument.id, 'create');
							req.flash('success', 'Het argument is geplaatst');
							return res.redirect('/');
						})
				} else if (req.params.action == 'delete') {
					argument
						.destroy()
						.then(result => {
							req.flash('success', 'Het argument is verwijderd');
							return res.redirect('/');
						})
				} else {
					return next();
				}
				
			})
			.catch(next);
	}) 

	// todo: dit moet eenmalig na registreren/login. Of via mail links
	app.use(function( req, res, next ) {

		if (req.user && req.user.complete) {
			console.log(JSON.stringify({ where: { userId: req.user.id, confirmationRequired: req.user.email }}, null, 2));
			db.Argument
				.findAll({ where: { userId: req.user.id, confirmationRequired: req.user.email }})
				.then(result => {
					if (result.length > 0) {
						res.out('ideas/arguments_confirm.njk', true, { arguments: result })
					} else {
						next();
					}
				})
		} else {
			next();
		}
		
	});
};
