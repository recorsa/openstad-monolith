var config  = require('config');
var Promise = require('bluebird');

Promise.longStackTraces();
process.env.DEBUG = config.get('logging');

var appName = process.env.NODE_ENV;
if( !appName ) {
	return console.error(`Run as \`NODE_ENV=appName node reset\`

where NODE_ENV is set to the value used to run the server`);
}

var db = require('./src/db');
db.sequelize.sync({force: true}).then(function() {
	return require(`./fixtures/${appName}`)(db);
})
.catch(function( e ) {
	throw e;
})
.finally(function() {
	db.sequelize.close();
});