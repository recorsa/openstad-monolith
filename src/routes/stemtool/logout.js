var Brute        = require('express-brute');
var config       = require('config');
var createError  = require('http-errors');
var express      = require('express');
var fs           = require('fs');
var nunjucks     = require('nunjucks');
var url          = require('url');

module.exports = function( app ) {

	var router = express.Router();
	app.use('/logout', router);

	router.route('/activate-button')
	.get(function( req, res, next ) {
		res.cookie('showLogoutButton', 'true', {
			maxAge   : 2 * 31536000000, // 2 years
			httpOnly : false,
			secure   : !config.get('debug')
		});
		res.success('/', true);
	})

	router.route('/deactivate-button')
	.get(function( req, res, next ) {
		res.cookie('showLogoutButton', 'false', {
			maxAge   : 2 * 31536000000, // 2 years
			httpOnly : false,
			secure   : !config.get('debug')
		});
		res.success('/', true);
	})

	router.route('/')
	.get(function( req, res, next ) {
		res.cookie('amsterdam.sid', '', {
			maxAge   : 0, // expire now
			httpOnly : true,
			secure   : !config.get('debug')
		});
		res.success('/', true);
	})

}
