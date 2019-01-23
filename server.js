if (!process.env.NODE_ENV) {
	return console.error('NODE_ENV environment variable not set');
}
if (!process.env.NODE_APP_INSTANCE) {
	return console.error('NODE_APP_INSTANCE environment variable not set');
}

var config = require('config');
// Env variable used by npm's `debug` package.
process.env.DEBUG = config.get('logging');

// Order is relevant.
require('./config/promises');
require('./config/moment');
require('./config/debug');
require('./config/notifications');

// Start HTTP server.
var Server     = require('./src/Server');
var Cron       = require('./src/Cron');
var ImageOptim = require('./src/ImageOptim');

Cron.start();
Server.start(config.get('express.port'));
ImageOptim.start();
