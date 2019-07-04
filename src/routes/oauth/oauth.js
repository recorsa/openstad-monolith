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

		req.session.userAccessToken = null;

		if (req.session.userAccessToken) {
			// al ingelogd
			return res.redirect(config.url + '/begroten')
		}

		// TODO: het is nu hardcoded voor WB; voor generiek zou het onderstaande moeten werken, maar daar moet dan wel een controle op
		// if (req.query.redirect_uri) {
		//  	req.session.afterLoginRedirectUri = req.query.redirect_uri
		// }

		let url = config.authorization['auth-server-url'] + config.authorization['auth-server-login-path'];
		url = url.replace(/\[\[clientId\]\]/, config.authorization['auth-client-id']);
		url = url.replace(/\[\[redirectUrl\]\]/, config.url + '/oauth/digest-login');

		//http://openstad-dev.francesco.denes.nl/begroten/oauth/digest-login


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
		if (!code) throw createError(403, 'Je bent niet ingelogd');

		let url = config.authorization['auth-server-url'] + config.authorization['auth-server-exchange-code-path'];

		// let postData = `client_id=${config.authorization['auth-client-id']}&client_secret=${config.authorization['auth-client-secret']}&code=${code}&grant_type=authorization_code&redirect_uri=${config.url + '/oauth/digest-login'}`;
		let postData = {
			client_id: config.authorization['auth-client-id'],
			client_secret: config.authorization['auth-client-secret'],
			code: code,
			grant_type: 'authorization_code',
		}

		fetch(
			url, {
				method: 'post',
				headers: {
					'Content-Type': 'application/json'
				},
				mode: 'cors',
				body: JSON.stringify(postData)
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

					return next();
				}
			)
			.catch(err => {
				console.log('CATCH ERR');
				console.log(err);
				return next(err);
			});

	})
	.get(function( req, res, next ) {
		// login done
		// TODO: zie /login
		// res.redirect(req.session.afterLoginRedirectUri || '/stemmen');
		let path = config.authorization['after-login-path'] || '/stemmen';
		res.redirect(path);
	})
	.get(function( error, req, res, next ) {
		// de error wil je tonen in de pagina, en wordt daarom meegestuurd in plaats van getoond
		res.header('Set-Cookie', 'openstad-error=' + ( error.message ? error.message : error ) + '; Path=/');
		// TODO: zie /login
		// res.redirect(req.session.afterLoginRedirectUri || '/stemmen');
		res.redirect('/stemmen');
	})

// uitloggen
// ---------
router
	.route('/logout')
	.get(function( req, res, next ) {

		let path = config.authorization['after-logout-path'] || '/stemmen';
		req.session.destroy(() => {
			res.success(path, true);
		});

	});

module.exports = router;
