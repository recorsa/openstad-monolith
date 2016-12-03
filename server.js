var yargs = require('yargs')
	.usage('$0 [--reset]')
	.help('h')
	.options({
		'reset': {
			description : 'Reset database with fixtures',
			alias       : 'r',
			default     : false
		},
		'test': {
			description : 'Run test suite',
			alias       : 't'
		}
	});
var argv = yargs.argv;

var config = require('config');
process.env.DEBUG = config.get('logging');

// Start HTTP server
// -----------------
var Server  = require('./src/Server');
var db      = require('./src/db');
var resetDB = argv.reset && config.get('debug');

db.sequelize.sync({force: resetDB}).then(function() {
	var doReset = resetDB ?
	              require('./fixtures')(db) :
	              null;
	return Promise.resolve(doReset).then(function() {
		if( !resetDB ) {
			Server.start(config.get('express.port'));
		} else {
			require('debug')('app:db')('sync done');
			db.sequelize.close();
		}
	});
}).catch(function( e ) {
	db.sequelize.close();
	throw e;
});