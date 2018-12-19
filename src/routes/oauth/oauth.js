const express = require('express');
const fetch = require('isomorphic-fetch');
const nunjucks = require('nunjucks');
const createError = require('http-errors');
const config = require('config');
const db = require('../../db');

let router = express.Router({mergeParams: true});

// inloggen 1
// ----------
router
	.route('/login')
	.get(function( req, res, next ) {

		if (req.session.userAccessToken) {
			// al ingelogd
			return res.redirect(config.url + '/begroten')
		}

		if (req.query.redirect_uri) {
			req.session.afterLoginRedirectUri = req.query.redirect_uri
		}

		let url = config.authorization['auth-server']
		url += '/oauth/authorize?';
		url += 'response_type=code';
		url += '&client_id=' + config.authorization['auth-client-id'];
		url += '&redirect_uri=' + config.url + '/oauth/digest-login';

		res.redirect(url);

	});

// inloggen 2
// ----------
router
	.route('/digest-login')
	.get(function( req, res, next ) {
		// use the code to get an access token

		let code = req.query.code;

		// TODO: meer afvangingen en betere response
		if (!code) return next(createError(403, 'Je bent niet ingelogd'));

		let url = config.authorization['auth-server']
		url += '/oauth/access_token'; // todo: naar config

		let postData = `client_id=${config.authorization['auth-client-id']}&client_secret=${config.authorization['auth-client-secret']}&code=${code}&grant_type=authorization_code&redirect_uri=${config.url + '/oauth/digest-login'}`;
		fetch(
			url, {
				method: 'post',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				mode: 'cors',
				body: postData
			})
			.then(
				response => response.json(),
				error => next // TODO: fatsoenlijke foutafvanging
			)
			.then(
				json => {
					
					let accessToken = json.access_token;
					if (!accessToken) return next(createError(403, 'Inloggen niet gelukt: geen accessToken'));

					// todo: alleen in de sessie is wel heel simpel
					req.session.userAccessToken = accessToken;

					return next()
				}
			);
		
	})
	.get(function( req, res, next ) {
		// login done
		console.log('--------------------inloggen ok')
		res.redirect(req.session.afterLoginRedirectUri || '/');
	})

module.exports = router;
