module.exports = function( sequelize, DataTypes ) {
	var ThumbsUp = sequelize.define('thumbs_up', {
		ideaId: DataTypes.INTEGER,
		userId: DataTypes.INTEGER
	}, {
		classMethods: {
			associate: function( models ) {
				ThumbsUp.belongsTo(models.Argument);
				ThumbsUp.belongsTo(models.User);
			}
		}
	});
	
	return ThumbsUp;
};