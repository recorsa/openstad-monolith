module.exports = function( sequelize, DataTypes ) {
	var model = sequelize.define('meeting', {
		date: DataTypes.DATE
	}, {
		classMethods: {
			associate: function( models ) {
				model.hasMany(models.Idea);
			}
		}
	});
	
	return model;
};