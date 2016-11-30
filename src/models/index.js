var _    = require('lodash');
var util = require('../util');

module.exports = function( db, sequelize, DataTypes ) {
	var models = util.invokeDir('./', function( modelDef ) {
		return modelDef(db, sequelize, DataTypes);
	}, this);
	
	// Invoke associations on each of the models.
	_.forEach(models, function( model ) {
		if( model.associate ) {
			model.associate(models);
		}
	});
	
	return models;
};