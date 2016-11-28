var config     = require('config');
var nodemailer = require('nodemailer');
var defaults   = require('lodash/defaults');

var debug      = require('debug');
var log        = debug('app:mail:sent');
var logError   = debug('app:mail:error');

var transporter    = nodemailer.createTransport(config.get('mail.transport'));
var defaultOptions = {
	from    : config.get('mail.from'),
	subject : 'No title',
	text    : 'No message'
};

module.exports = {
	sendMail: function( options ) {
		return new Promise(function( resolve, reject ) {
			transporter.sendMail(
				defaults(options, defaultOptions),
				function( error, info ) {
					if( error ) {
						logError(error)
						reject(error);
					} else {
						log(info.response);
						resolve(info);
					}
				}
			);
		});
	}
}