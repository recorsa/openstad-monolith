module.exports = function( sequelize, DataTypes ) {
	var model = sequelize.define('argument', {
		ideaId: DataTypes.INTEGER,
		userId: DataTypes.INTEGER,
		sentiment: {
			type         : DataTypes.ENUM('negative', 'positive'),
			defaultValue : 'positive',
			allowNull    : false
		},
		content: DataTypes.TEXT
	}, {
		classMethods: {
			associate: function( models ) {
				model.belongsTo(models.Idea, {
					onUpdate: 'RESTRICT',
					onDelete: 'CASCADE'
				});
				model.belongsTo(models.User);
			}
		}
	});
	
	return model;
};