var sanitize = require('../util/sanitize');

module.exports = function( db, sequelize, DataTypes ) {
	var AgendaItem = sequelize.define('agenda_item', {
		ideaId: {
			type         : DataTypes.INTEGER,
			allowNull    : false
		},
		startDate: {
			type         : DataTypes.DATEONLY,
			allowNull    : false
		},
		endDate: {
			type         : DataTypes.DATEONLY,
			allowNull    : true
		},
		description: {
			type         : DataTypes.STRING,
			allowNull    : false,
			set          : function( text ) {
				this.setDataValue('description', sanitize.summary(text.trim()));
			}
		},
		actionText: {
			type         : DataTypes.STRING,
			allowNull    : true,
			set          : function( text ) {
				var value = text ? sanitize.title(text.trim()) : text;
				this.setDataValue('actionText', value);
			}
		},
		actionURL: {
			type         : DataTypes.STRING,
			allowNull    : true
		}
	}, {
		classMethods: {
			scopes: scopes,
			associate: function( models ) {
				this.belongsTo(models.Idea);
			}
		}
	});
	
	function scopes() {
		return {
			defaultScope: {}
		};
	}
	
	return AgendaItem;
};
