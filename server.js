var config = require('config');
process.env.DEBUG = config.get('logging');

require('./config/debug');
require('./config/moment');

// Start HTTP server
var Server     = require('./src/Server');
var Cron       = require('./src/Cron');
var ImageOptim = require('./src/ImageOptim');

Cron.start();
Server.start(config.get('express.port'));
ImageOptim.start();