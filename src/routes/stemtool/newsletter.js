var config       = require('config');
var createError  = require('http-errors');
var express      = require('express');
var nunjucks     = require('nunjucks');
var Promise      = require('bluebird');

var auth         = require('../../auth');
var db           = require('../../db');

var uidProperty    = config.get('security.sessions.uidProperty');
var maxPollChoices = config.get('polls.maxChoices');

module.exports = function( app ) {

	var router = express.Router();
	app.use('/newsletter', router);

	router.route('/signup')
    .all(function( req, res, next ) {
      return next();
    })
	.post(auth.can('newsletter:signup'))
	  .post(function( req, res, next ) {

		var user    = req.user;

    let nickName = req.body.newsletterName
    if (!nickName) {
		  throw createError(400, 'Geen naam opgegeven');
    }
    let email = req.body.newsletterEmail
    if (!email || email.search(/^[^ ]+@[^ ]+\.[^ ]+$/) == -1) {
		  throw createError(400, 'Email adres niet geldig');
    }

    let signedUpForNewsletter = true;

		(
			user.isAnonymous() ?
			Promise.resolve(user) :
			db.User.registerAnonymous(null)
		)
		.then(function( user ) {
			return user.update({email, nickName, signedUpForNewsletter });
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
