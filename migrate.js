var Umzug = require('umzug');
var db    = require('./src/db');

var umzug = new Umzug({
	storage: 'sequelize',
	storageOptions : {
		sequelize : db.sequelize,
		modelName : 'Migrations',
		tableName : 'migrations'
	},
	migrations : {
		path    : 'migrations',
		pattern : /^\d+[\w_-]+\.js$/
	}
});

umzug.up()
.then(function( migrations ) {
	var fileNames = migrations.map(m => m.file);
	console.log(fileNames.join('\n'));
})
.finally(function() {
	process.exit();
});