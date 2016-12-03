module.exports = function( db, sequelize, DataTypes ) {
	var Argument = sequelize.define('argument', {
		ideaId: {
			type         : DataTypes.INTEGER,
			allowNull    : false
		},
		userId: {
			type         : DataTypes.INTEGER,
			allowNull    : false
		},
		sentiment: {
			type         : DataTypes.ENUM('against', 'for'),
			defaultValue : 'for',
			allowNull    : false
		},
		description: {
			type         : DataTypes.TEXT,
			allowNull    : false
		}
	}, {
		classMethods: {
			scopes: scopes,
			associate: function( models ) {
				this.belongsTo(models.Idea);
				this.belongsTo(models.User);
			}
		}
	});
	
	function scopes() {
		return {
			defaultScope: {
				include: [{
					model      : db.User,
					attributes : ['firstName', 'lastName']
				}]
			}
		};
	}
	
	return Argument;
};