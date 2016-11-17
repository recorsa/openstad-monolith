module.exports = function( sequelize, DataTypes ) {
	var Argument = sequelize.define('argument', {
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
				Argument.belongsTo(models.Idea);
				Argument.belongsTo(models.User);
			}
		}
	});
	
	return Argument;
};