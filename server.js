var config = require('config');
var Server = require('./src/Server');
var db     = require('./src/db');

var yargs = require('yargs')
	.usage('$0 [--reset]')
	.help('h')
	.options({
		'reset': {
			description : 'Reset database with fixtures',
			alias       : 'r',
			default     : false
		},
		'verbose': {
			description : 'Visual logging verbosity',
			alias       : 'v',
			count       : true
		},
		'test': {
			description : 'Run test suite',
			alias       : 't'
		}
	});
var argv = yargs.argv;

// Start HTTP server.
var resetDB = argv.reset && config.get('debug');
db.sequelize.sync({force: resetDB}).then(function() {
	var doReset = resetDB ?
	              require('./fixtures')(db) :
	              null;
	return Promise.resolve(doReset).then(function() {
		Server.start(config.get('express.port'));
	});
}).catch(function( e ) {
	db.sequelize.close();
	throw e;
});