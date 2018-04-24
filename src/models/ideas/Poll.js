var config         = require('config');
var createError    = require('http-errors');
var defaults       = require('lodash/defaults');

var sanitize       = require('../../util/sanitize');

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
				var votedUsers = this.votedUsers;

				console.log('votedUsers', votedUsers);

				if( !Array.isArray(options) ) {
					throw Error('Geen poll opties gevonden');
				}

				return options.reduce(function( totalVoteCount, option ) {
					return totalVoteCount + option.voteCount;
				}, 0);
			}
		},

	}, {
		classMethods: {
			scopes: scopes,
			associate: function( models ) {
				this.belongsTo(models.Idea);
				this.hasMany(models.PollOption, {as: 'options'});
				// To associate the votes the current user has cast.
				// Plural, because in some polls, the user can cast
				// multiple votes.
				this.hasMany(models.PollVote, {as: 'userVotes'});
			}
		},
		instanceMethods: {
			addVote: function( user, choices, ip ) {
				// ... and bulk create if user has not voted yet.
				var data = {
					pollId : this.id,
					userId : user.id,
					ip     : ip
				};

				return db.PollVote.findOne({where: data})
				.then(function( vote ) {
					if( vote ) {
						throw createError(400, 'Reeds gestemd');
					}
					var rows = choices.map(function( choice ) {
						return defaults({pollOptionId: choice}, data);
					});
					return db.PollVote.bulkCreate(rows);
				})
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
					attributes : ['id', 'order', 'title', 'intro', 'description']
				}]
			},

			withVoteCount: {
				include: [{
					model      : db.PollOption,
					as         : 'options',
					required   : false,
					attributes : [
						'id', 'order', 'title', 'intro', 'description',
						[sequelize.literal(`
							(SELECT DISTINCT
								COUNT(*)
							FROM
								poll_votes pv
							WHERE
								pv.deletedAt IS NULL AND (
									pv.checked IS NULL OR
									pv.checked  = 1
								) AND
								pv.pollOptionId = \`options\`.\`id\`
							)
						`), 'voteCount']
					]
				}]
			},

			withUserVote: function(userId) {
				userId = Number(userId);
				if( !userId ) return {};

				return {
					include: [{
						model    : db.PollVote,
						as       : 'userVotes',
						required : false,
						where    : {userId}
					}]
				};
			},


		};
	}

	return Poll;
};
