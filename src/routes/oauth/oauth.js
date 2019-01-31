const express = require('express');
const fetch = require('isomorphic-fetch');
const jwt = require('jsonwebtoken');
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

		let url = config.authorization['auth-server-url'] + config.authorization['auth-server-login-path'];
		url = url.replace(/\[\[clientId\]\]/, config.authorization['auth-client-id']);
		url = url.replace(/\[\[redirectUrl\]\]/, config.url + '/oauth/digest-login');

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
				console.log('OAUTH DIGEST - FETCH TOKEN ERR');
				console.log(err);
				return next(err);
			});
		
	})
	.get(function( req, res, next ) {

		// get the user info using the access token
		let url = config.authorization['auth-server-url'] + config.authorization['auth-server-get-user-path'];
		url = url.replace(/\[\[clientId\]\]/, config.authorization['auth-client-id']);

		fetch(
			url, {
				method: 'get',
				headers: {
					authorization : 'Bearer ' + req.session.userAccessToken,
				},
				mode: 'cors',
			})
			.then(
				response => response.json(),
				error => { return next(createError(403, 'User niet bekend')); }
			)
			.then(
				json => {
					req.userData = json;
					return next()
				}
			)
			.catch(err => {
				console.log('OAUTH DIGEST - GET USER ERROR');
				console.log(err);
				next(err);
			})

	})
	.get(function( req, res, next ) {

		let data = {
			externalUserId: parseInt(req.userData.user_id),
			email: req.userData.email,
			firstName: req.userData.firstName,
			zipCode: req.userData.postcode,
			lastName: req.userData.lastName,
		}

		// TODO: validate data
		console.log(data);

		// find or create the user
		db.User
			.findAll({where: { $or: [ { externalUserId: req.userData.user_id }, { email: req.userData.email } ] }})
			.then(result => {
				if (result && result.length > 1) return next(createError(403, 'Meerdere users gevonden'));
				if (result && result.length == 1) {
					// user found; update and use
					let user = result[0];
					console.log('USER FOUND', user.id);
					user.update(data);
					req.setSessionUser(user.id, '');
					return next();
				} else {
					// user not found; create
					console.log('USER NOT FOUND');
					data.role = 'member';
					data.complete = true;
					db.User
						.create(data)
						.then(result => {
							console.log('USER CREATED', result.id);
							req.setSessionUser(result.id, '');
							return next();
						})
						.catch(err => {
							console.log('OAUTH DIGEST - CREATE USER ERROR');
							console.log(err);
							next(err);
						})
				}
			})
	})
	.get(function( req, res, next ) {

		let redirectUrl = req.site && req.site.config['after-login-redirect-uri'];
		redirectUrl = redirectUrl || config.authorization['after-login-redirect-uri'];
		redirectUrl = redirectUrl || '/';

		if (redirectUrl.match('[[jwt]]')) {
			jwt.sign({userId: req.user.id}, config.authorization['jwt-secret'], { expiresIn: 182 * 24 * 60 * 60 }, (err, token) => {
				if (err) return next(err)
				req.redirectUrl = redirectUrl.replace('[[jwt]]', token)
				return next();
			});
		} else {
			req.redirectUrl = redirectUrl;
			return next();
		}

	})
	.get(function( req, res, next ) {
		res.redirect(req.redirectUrl);
	})

// uitloggen
// ---------
router
	.route('/logout')
	.get(function( req, res, next ) {

		req.session.destroy();
		res.success('/', true);

	});

module.exports = router;
