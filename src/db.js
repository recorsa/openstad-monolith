var Sequelize = require('sequelize');
var _         = require('lodash');

var config    = require('config').get('database');
var sequelize = new Sequelize(config.database, config.user, config.password, {
	dialect        : config.dialect,
	host           : config.host,
	dialectOptions : {
		multipleStatements: config.multipleStatements
	},
	timeZone       : config.timeZone,
	logging        : config.logging ? log : false,
	
	define: {
		underscored    : false, // preserve columName casing.
		underscoredAll : true, // tableName to table_name.
		paranoid       : true // deletedAt column instead of removing data.
	},
	pool: {
		min  : 0,
		max  : 5,
		idle : 10000
	},
});

var models = require('./models')(sequelize);
module.exports = _.extend({}, models, {sequelize: sequelize});

function log(query) {
	console.log('DEBUG: ' + query + '\n');
}