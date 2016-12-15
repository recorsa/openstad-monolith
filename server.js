var config = require('config');
process.env.DEBUG = config.get('logging');

// Start HTTP server
// -----------------
var Server  = require('./src/Server');
var Cron    = require('./src/Cron');
var db      = require('./src/db');

db.sequelize.sync().then(function() {
	Cron.start();
	Server.start(config.get('express.port'));
}).catch(function( e ) {
	db.sequelize.close();
	throw e;
});