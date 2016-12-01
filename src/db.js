var Sequelize = require('sequelize');
var _         = require('lodash');
var util      = require('./util');

var config    = require('config').get('database');
var sequelize = new Sequelize(config.database, config.user, config.password, {
	dialect        : config.dialect,
	host           : config.host,
	dialectOptions : {
		multipleStatements: config.multipleStatements
	},
	timeZone       : config.timeZone,
	logging        : require('debug')('app:db:query'),
	
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

// Define models.
var db     = {sequelize: sequelize};
var models = require('./models')(db, sequelize, Sequelize.DataTypes);
_.extend(db, models);

// Invoke associations on each of the models.
_.forEach(models, function( model ) {
	if( model.associate ) {
		model.associate(models);
	}
});

module.exports = db;