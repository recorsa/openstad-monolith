var sanitize = require('../../util/sanitize');

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
			allowNull    : false,
			validate     : {
				len: {
					args : [140,500],
					msg  : 'Bericht moet tussen 140 en 500 tekens zijn'
				}
			},
			set          : function( text ) {
				this.setDataValue('description', sanitize.argument(text));
			}
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
					attributes : ['firstName', 'lastName', 'email']
				}]
			}
		};
	}
	
	return Argument;
};