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
		},
		
		totalVoteCount: {
			type         : DataTypes.VIRTUAL,
			get: function() {
				var options = this.options;
				if( !Array.isArray(options) ) {
					throw Error('Geen poll opties gevonden');
				}
				
				return options.reduce(function( totalVoteCount, option ) {
					return totalVoteCount + option.voteCount;
				}, 0);
			}
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
					as         : 'options',
					required   : false,
					attributes : [
						'order', 'title', 'intro', 'description',
						[sequelize.literal(`
							(SELECT
								COUNT(*)
							FROM
								poll_votes pv
							WHERE
								pv.deletedAt IS NULL AND (
									pv.checked IS NULL OR
									pv.checked  = 1
								) AND
								pv.pollOptionId = \`poll.options\`.\`id\`)
						`), 'voteCount']
					]
				}]
			}
		};
	}
	
	return Poll;
};