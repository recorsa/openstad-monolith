module.exports = function( sequelize, DataTypes ) {
	var model = sequelize.define('thumbs_up', {
		ideaId: DataTypes.INTEGER,
		userId: DataTypes.INTEGER
	}, {
		classMethods: {
			associate: function( models ) {
				model.belongsTo(models.Argument, {
					onUpdate: 'RESTRICT',
					onDelete: 'CASCADE'
				});
				model.belongsTo(models.User);
			}
		}
	});
	
	return model;
};