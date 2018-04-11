var config  = require('config');
var Promise = require('bluebird');

Promise.longStackTraces();
process.env.DEBUG = config.get('logging');

var db = require('./src/db');

if( !config.get('debug') ) {
	return console.error('Not in debug mode');
}

var appName = process.argv[2];
if( !appName ) {
	return console.error(`Run as \`node reset NODE_ENV\`

where NODE_ENV is set to the value used to run
the application (\`NODE_ENV=appName node server\`)`);
}

db.sequelize.sync({force: true}).then(function() {
	return require(`./fixtures/${appName}`)(db);
})
.catch(function( e ) {
	throw e;
})
.finally(function() {
	db.sequelize.close();
});