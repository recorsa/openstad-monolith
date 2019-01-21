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
	.get(function(req, res, next) {

		console.log('req.session.userAccessToken 1', req.session.userAccessToken);

		if (req.session.userAccessToken) {
			// al ingelogd
			return res.redirect(config.url)
		}

		// TODO: het is nu hardcoded voor WB; voor generiek zou het onderstaande moeten werken, maar daar moet dan wel een controle op
		// if (req.query.redirect_uri) {
		//  	req.session.afterLoginRedirectUri = req.query.redirect_uri
		// }

		let url = config.authorization['auth-server-url'] + config.authorization['auth-server-login-path'];
		url = url.replace(/\[\[clientId\]\]/, config.authorization['auth-client-id']);
		url = url.replace(/\[\[redirectUrl\]\]/, config.url + '/oauth/digest-login');

		//http://openstad-dev.francesco.denes.nl/begroten/oauth/digest-login

		console.log('redirect to: ', url);

		res.redirect(url);

	});

// inloggen 2
// ----------
router
	.route('/digest-login')
	.get(function( req, res, next ) {
		console.log('codea');

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
				(err) => {
					console.log('err', err);
					next()
				} // TODO: fatsoenlijke foutafvanging
			)
			.then(
				json => {
					let accessToken = json.access_token;
					console.log('accessToken', accessToken);


					if (!accessToken) return next(createError(403, 'Inloggen niet gelukt: geen accessToken'));

					// todo: alleen in de sessie is wel heel simpel
					req.session.userAccessToken = accessToken;
				//	req.session.justLoggedIn = true;

					console.log('accessTokens session', req.session);
					req.session.save((err) => {
                if (!err) {
									console.log('save callback session', req.session);

									return next();
                } else {
									console.log('errr', err);
								}
            });

				}
			)
			.catch(err => {
				console.log('CATCH ERREEEE');
				console.log(err);
				return next(err);
			});

	})
	.get(function( req, res, next ) {
		// login done
		// TODO: zie /login
		 res.redirect(config.authorization.afterLoginRedirectUri || '/stemmen');
//		console.log('redirect', config.authorization.afterLoginRedirectUri);

	//	res.redirect(config.authorization.afterLoginRedirectUri);
	})
	.get(function( error, req, res, next ) {
		// de error wil je tonen in de pagina, en wordt daarom meegestuurd in plaats van getoond
		res.header('Set-Cookie', 'openstad-error=' + ( error.message ? error.message : error ) + '; Path=/');
		// TODO: zie /login
		// res.redirect(req.session.afterLoginRedirectUri || '/stemmen');
		res.redirect(config.authorization.afterLoginRedirectUri);
	})

// uitloggen©
// ---------
router
	.route('/logout')
	.get(function( req, res, next ) {
		let url = config.authorization['auth-server-url'] + config.authorization['auth-server-logout-path'];
		url = url.replace(/\[\[clientId\]\]/, config.authorization['auth-client-id']);
		url = url.replace(/\[\[redirectUrl\]\]/, config.url + '/oauth/digest-login');
		res.success(url, true);
	});

module.exports = router;
