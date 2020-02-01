var config = require('config');

module.exports = function( db, sequelize, DataTypes ) {
	var PollVote = sequelize.define('poll_vote', {
		pollId: {
			type         : DataTypes.INTEGER,
			allowNull    : false
		},
		pollOptionId: {
			type         : DataTypes.INTEGER,
			allowNull    : false
		},
		userId: {
			type         : DataTypes.INTEGER,
			allowNull    : false
		},
		ip: {
			type         : DataTypes.STRING(64),
			allowNull    : true,
			validate     : {
				isIP: true
			}
		},
		opinion: {
			type         : DataTypes.ENUM('no','yes'),
			allowNull    : false,
			defaultValue : 'yes'
		},
		// This will be true if the vote validation CRON determined this
		// vote is valid.
		checked : {
			type         : DataTypes.BOOLEAN,
			allowNull    : true
		}
	}, {
		indexes: [{
			fields : ['pollOptionId', 'userId'],
			unique : true
		}],
		classMethods: {
			associate: function( models ) {
				PollVote.belongsTo(models.Poll);
				PollVote.belongsTo(models.PollOption);
				PollVote.belongsTo(models.User);
			},
			scopes : function () {
				return {
					withUser: {
						include: [{
							model      : db.User,
							attributes : ['role', 'nickName', 'firstName', 'lastName', 'email']
						}],

					},
				}
				//'withPollOption'
			},

			anonimizeOldVotes: function() {
				var anonimizeThreshold = config.get('ideas.anonimizeThreshold');
				return sequelize.query(`
					UPDATE
						poll_votes v
					SET
						v.ip = NULL
					WHERE
						DATEDIFF(NOW(), v.updatedAt) > ${anonimizeThreshold} AND
						checked != 0
				`)
				.spread(function( result, metaData ) {
					return metaData;
				});
			}
		},
		instanceMethods: {
			toggle: function() {
				var checked = this.get('checked');
				return this.update({
					checked: checked === null ? false : !checked
				});
			}
		}
	});

	return PollVote;
};
