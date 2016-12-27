var config = require('config');
process.env.DEBUG = config.get('logging');

// Start HTTP server
// -----------------
var Server  = require('./src/Server');
var Cron    = require('./src/Cron');

Cron.start();
Server.start(config.get('express.port'));