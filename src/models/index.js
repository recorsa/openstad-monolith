var _ = require('lodash');

module.exports = function( sequelize ) {
	var models = {};
	require('fs').readdirSync(__dirname + '/').forEach(function( file ) {
		if(
			file !== 'index.js' &&
			file.match(/\.js$/) !== null
		) {
			var modelName = file.replace(/\.js$/, '');
			models[modelName] = sequelize.import(file);
		}
	});

	// Invoke associations on each of the models.
	_.forEach(models, function( model ) {
		if( model.associate ) {
			model.associate(models);
		}
	});
	
	return models;
};