var config = require('config');
process.env.DEBUG = config.get('logging');

require('./config/moment');

// Start HTTP server
// -----------------
var Server  = require('./src/Server');
var Cron    = require('./src/Cron');

Cron.start();
Server.start(config.get('express.port'));