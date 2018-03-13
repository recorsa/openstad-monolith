var sanitize = require('../../util/sanitize');

module.exports = function( db, sequelize, DataTypes ) {
	var Poll = sequelize.define('poll', {
		ideaId: {
			type         : DataTypes.INTEGER,
			allowNull    : false
		},
		title: {
			type         : DataTypes.STRING(150),
			allowNull    : false
		},
		description: {
			type         : DataTypes.TEXT,
			allowNull    : true
		}
	}, {
		classMethods: {
			scopes: scopes,
			associate: function( models ) {
				this.belongsTo(models.Idea);
				this.hasMany(models.PollOption, {
					as: 'options'
				});
			}
		}
	});
	
	function scopes() {
		return {
			defaultScope: {
				include: [{
					model      : db.PollOption,
					attributes : ['order', 'title', 'intro', 'description'],
					as         : 'options',
					required   : false
				}]
			}
		};
	}
	
	return Poll;
};