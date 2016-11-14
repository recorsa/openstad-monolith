module.exports = function( sequelize, DataTypes ) {
	var model = sequelize.define('vote', {
		ideaId: DataTypes.INTEGER,
		userId: DataTypes.INTEGER,
		opinion: {
			type         : DataTypes.ENUM('no','yes','abstain'),
			defaultValue : 'abstain',
			allowNull    : false
		}
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