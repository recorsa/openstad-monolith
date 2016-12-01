module.exports = function( db, sequelize, DataTypes ) {
	var Vote = sequelize.define('vote', {
		ideaId: {
			type         : DataTypes.INTEGER,
			allowNull    : false
		},
		userId: {
			type         : DataTypes.INTEGER,
			allowNull    : false
		},
		opinion: {
			type         : DataTypes.ENUM('no','yes','abstain'),
			defaultValue : 'abstain',
			allowNull    : false
		}
	}, {
		indexes: [{
			fields : ['ideaId', 'userId'],
			unique : true
		}],
		classMethods: {
			associate: function( models ) {
				Vote.belongsTo(models.Idea);
				Vote.belongsTo(models.User);
			}
		}
	});
	
	return Vote;
};