var sanitize = require('../../util/sanitize');

module.exports = function( db, sequelize, DataTypes ) {
	var Poll = sequelize.define('poll_option', {
		pollId: {
			type         : DataTypes.INTEGER,
			allowNull    : false
		},
		order: { // A, B, C, D...
			type         : DataTypes.STRING(1),
			allowNull    : false
		},
		title: {
			type         : DataTypes.STRING(150),
			allowNull    : false
		},
		intro: {
			type         : DataTypes.STRING,
			allowNull    : true
		},
		description: {
			type         : DataTypes.TEXT,
			allowNull    : false
		},
		voteCount: {
			type         : DataTypes.VIRTUAL
		}
		// TODO: posterImage, other images...
	}, {
		classMethods: {
			scopes: scopes,
			associate: function( models ) {
				this.belongsTo(models.Poll);
				this.hasMany(models.PollVote, {
					as: 'votes'
				});

				//this.hasMany(models.PollVote);
			}
		}
	});

	function scopes() {
		return {
			defaultScope: {},
			withUser: {
				include: [{
					model      : db.User,
					attributes : ['role', 'nickName', 'firstName', 'lastName', 'email']
				}]
			},
		};
	}

	return Poll;
};
