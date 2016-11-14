var config = require('config');
var Server = require('./src/Server');

// Just to predefine models during start up.
var db = require('./src/db');
db.sequelize.sync({force: true}).then(function() {
	return require('./fixtures')(db).then(function() {
		db.sequelize.close();
	});
}).catch(function( e ) {
	throw e;
});

// Server.start(config.get('express.port'));