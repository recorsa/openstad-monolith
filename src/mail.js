var config     = require('config');
var nodemailer = require('nodemailer');
var defaults   = require('lodash/defaults');

var debug      = require('debug');
var log        = debug('app:mail:sent');
var logError   = debug('app:mail:error');

var method     = config.get('mail.method');
var transport  = config.get('mail.transport');

var transporter;
switch( method ) {
	case 'smtp':
		transporter = nodemailer.createTransport(transport.smtp);
		break;
	case 'sendgrid':
		var sendGrid = require('nodemailer-sendgrid-transport');
		var sgConfig = sendGrid(transport.sendgrid);
		transporter  = nodemailer.createTransport(sgConfig);
		break;
}

// Default options for a single email.
var defaultSendMailOptions = {
	from    : config.get('mail.from'),
	subject : 'No title',
	text    : 'No message'
};
module.exports = {
	sendMail: function( options ) {
		return new Promise(function( resolve, reject ) {
			transporter.sendMail(
				defaults(options, defaultSendMailOptions),
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