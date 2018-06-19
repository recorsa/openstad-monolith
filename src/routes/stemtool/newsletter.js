var createError  = require('http-errors');
var express      = require('express');
var Promise      = require('bluebird');

var auth         = require('../../auth');
var db           = require('../../db');

module.exports = function( app ) {
	var router = express.Router();
	app.use('/newsletter', router);

	router.route('/signup')
	.post(auth.can('newsletter:signup'))
	.post(function( req, res, next ) {
		var user     = req.user;
		var nickName = req.body.newsletterName;
		var email    = req.body.newsletterEmail;
		
		if( !nickName ) {
			throw createError(400, 'Geen naam opgegeven');
		} else if( !email || email.search(/^[^ ]+@[^ ]+\.[^ ]+$/) == -1 ) {
			throw createError(400, 'Email adres niet geldig');
		}
		
		(
			user.isAnonymous() ?
			Promise.resolve(user) :
			db.User.registerAnonymous(null)
		)
		.then(function( user ) {
			return user.update({email, nickName, signedUpForNewsletter: true});
		})
		.then(function( user ) {
			req.setSessionUser(user.id);
			req.flash('success', 'Je bent nu aangemeld');
			res.success('/', true);
		})
		.catch(db.sequelize.ValidationError, function( err ) {
			var error = Error(err.errors[0].message);
			error.status = 400;
			next(error);
		})
		.catch(next);
	})
};
