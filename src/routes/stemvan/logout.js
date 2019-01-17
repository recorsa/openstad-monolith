var Brute        = require('express-brute');
var config       = require('config');
var express      = require('express');

module.exports = function( app ) {
	var router = express.Router();
	app.use('/logout', router);

	router.get('/activate-button',   setLogoutButtonCookie(true));
	router.get('/deactivate-button', setLogoutButtonCookie(false));

	router.route('/')
	.get(function( req, res, next ) {
		//req.session.destroy();
		res.success('/', true);
	});
};

function setLogoutButtonCookie( bool ) {
	var showButton = bool ? 'true' : 'false';
	var secure     = config.get('security.sessions.onlySecure');

	return function( req, res, next ) {
		res.cookie('showLogoutButton', showButton, {
			maxAge   : 2592000000, // 30 days
			httpOnly : false,
			secure   : secure
		});
		res.success('/', true);
	};
}
