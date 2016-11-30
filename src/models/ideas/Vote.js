module.exports = function( db, sequelize, DataTypes ) {
	var Vote = sequelize.define('vote', {
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
				Vote.belongsTo(models.Idea);
				Vote.belongsTo(models.User);
			}
		}
	});
	
	return Vote;
};