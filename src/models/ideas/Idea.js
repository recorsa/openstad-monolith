var co       = require('co')
  , moment   = require('moment-timezone')
  , pick     = require('lodash/pick');
var sanitize = require('../../util/sanitize');

module.exports = function( db, sequelize, DataTypes ) {
	var Idea = sequelize.define('idea', {
		meetingId: {
			type         : DataTypes.INTEGER,
			allowNull    : false
		},
		userId: {
			type         : DataTypes.INTEGER,
			allowNull    : false
		},
		startDate: {
			type         : DataTypes.DATE,
			allowNull    : false
		},
		endDate: {
			type         : DataTypes.DATE,
			allowNull    : true
		},
		sort: {
			type         : DataTypes.INTEGER,
			allowNull    : false,
			defaultValue : 1
		},
		status: {
			type         : DataTypes.ENUM('OPEN','CLOSED','ACCEPTED','DENIED','BUSY','DONE'),
			defaultValue : 'OPEN',
			allowNull    : false
		},
		title: {
			type         : DataTypes.STRING(255),
			allowNull    : false,
			set          : function( text ) {
				this.setDataValue('title', sanitize.title(text));
			}
		},
		summary: {
			type         : DataTypes.TEXT,
			allowNull    : false,
			set          : function( text ) {
				this.setDataValue('summary', sanitize.summary(text));
			}
		},
		description: {
			type         : DataTypes.TEXT,
			allowNull    : false,
			set          : function( text ) {
				this.setDataValue('description', sanitize.content(text));
			}
		},
		modBreak: {
			type         : DataTypes.TEXT,
			allowNull    : true,
			set          : function( text ) {
				this.setDataValue('modBreak', sanitize.content(text));
			}
		},
		// Counts set in `summary`/`withVotes` scope.
		no: {
			type         : DataTypes.VIRTUAL
		},
		yes: {
			type         : DataTypes.VIRTUAL
		},
		argCount: {
			type         : DataTypes.VIRTUAL
		}
	}, {
		hooks: {
			beforeValidate: co.wrap(function*( idea, options ) {
				// Automatically determine `endDate`, and `meetingId`.
				if( idea.changed('startDate') ) {
					var endDate = moment(idea.startDate).add(2, 'weeks').toDate();
					var meeting = yield sequelize.models.meeting.findOne({
						where: {
							date: {$gt: endDate}
						},
						order: 'date ASC'
					});
					
					idea.setDataValue('endDate', endDate);
					idea.setDataValue('meetingId', meeting.id);
				}
			})
		},
		validate: {
			validDeadline: function() {
				if( this.endDate - this.startDate < 43200000 ) {
					throw new Error('An idea must run at least 1 day');
				}
			}
		},
		classMethods: {
			scopes: scopes,
			
			associate: function( models ) {
				this.belongsTo(models.Meeting);
				this.belongsTo(models.User);
				this.hasMany(models.Vote);
				this.hasMany(models.Argument, {as: 'argumentsAgainst'});
				this.hasMany(models.Argument, {as: 'argumentsFor'});
				this.hasMany(models.Image);
			},
			
			getRunningIdeas: function( limit ) {
				// What we want to achieve:
				// 
				// ```sql
				// SELECT FROM ideas i
				// INNER JOIN meetings m ON
				// 	m.id = i.meetingId
				// WHERE
				// 	i.status IN ('OPEN', 'CLOSED') OR (
				// 		i.status = 'DENIED' AND
				// 		m.date >= UTC_TIMESTAMP()
				// 	)
				// ```
				return this.scope('summary').findAll({
					where: {
						$or: [
							{status: {$in: ['OPEN', 'CLOSED']}},
							{
								$and: [
									{status: 'DENIED'},
									sequelize.where(db.Meeting.rawAttributes.date, '>=', new Date())
								]
							}
						]
					},
					order   : 'sort, endDate DESC',
					include : [{
						model: db.Meeting,
						attributes: []
					}],
					limit   : limit
				});
			},
			getHistoricIdeas: function() {
				return this.scope('summary').findAll({
					where: {
						status: {$notIn: ['OPEN', 'CLOSED']}
					},
					order: 'updatedAt DESC'
				});
			}
		},
		instanceMethods: {
			isOpen: function() {
				return this.status === 'OPEN';
			},
			
			addUserVote: function( user, opinion, ip ) {
				var data = {
					ideaId  : this.id,
					userId  : user.id,
					opinion : opinion,
					ip      : ip
				};
				
				return db.Vote.findOne({where: data})
				.then(function( vote ) {
					if( vote ) {
						return vote.destroy();
					} else {
						// HACK: `upsert` on paranoid deleted row doesn't unset
						//        `deletedAt`.
						// TODO: Pull request?
						data.deletedAt = null;
						return db.Vote.upsert(data);
					}
				})
				.then(function( result ) {
					// When the user double-voted with the same opinion, the vote
					// is removed: return `true`. Otherwise return `false`.
					// 
					// `vote.destroy` returns model when `paranoid` is `true`.
					return result && !!result.deletedAt;
				});
			},
			addUserArgument: function( user, data ) {
				var filtered = pick(data, ['sentiment', 'description']);
				filtered.ideaId = this.id;
				filtered.userId = user.id;
				return db.Argument.create(filtered);
			},
			
			setModBreak: function( modBreak ) {
				return this.update({modBreak: modBreak});
			},
			setStatus: function( status ) {
				if( this.yes === undefined ) {
					throw Error('Idea.setStatus needs scope `withVotes`');
				}
				if( status === 'CLOSED' && this.yes < 50 ) {
					status = 'DENIED';
				}
				return this.update({status: status});
			},
			
			updateImages: function( imageKeys ) {
				var self = this;
				if( !imageKeys || !imageKeys.length ) {
					imageKeys = [''];
				}
				
				return Promise.all([
					db.Image.update({ideaId: this.id}, {
						where: {
							key    : {$in: imageKeys}
						}
					}),
					db.Image.destroy({
						where: {
							ideaId : this.id,
							key    : {$notIn  : imageKeys}
						}
					})
				]).then(function() {
					return self;
				});
			}
		}
	});
	
	function scopes() {
		// Helper function used in `withVotes` scope.
		function voteCount( opinion ) {
			return [sequelize.literal(`
				(SELECT
					COUNT(*)
				FROM
					votes v
				WHERE
					v.deletedAt IS NULL AND (
						v.checked IS NULL OR
						v.checked  = 1
					) AND
					v.ideaId     = idea.id AND
					v.opinion    = "${opinion}")
			`), opinion];
		}
		function argCount( fieldName ) {
			return [sequelize.literal(`
				(SELECT
					COUNT(*)
				FROM
					arguments a
				WHERE
					a.deletedAt IS NULL AND
					a.ideaId     = idea.id)
			`), fieldName];
		}
		
		return {
			summary: {
				attributes: {
					include: [
						voteCount('yes'),
						voteCount('no'),
						argCount('argCount')
					],
					exclude: ['description', 'modBreak']
				}
			},
			withUser: {
				include: [{
					model      : db.User,
					attributes : ['firstName', 'lastName']
				}]
			},
			withVotes: {
				attributes: Object.keys(this.attributes).concat([
					voteCount('yes'),
					voteCount('no')
				])
			},
			withArguments: {
				include: [{
					model    : db.Argument,
					as       : 'argumentsAgainst',
					required : false,
					where    : {
						sentiment: 'against'
					}
				}, {
					model    : db.Argument,
					as       : 'argumentsFor',
					required : false,
					where    : {
						sentiment: 'for'
					}
				}]
			}
		}
	}
				
	return Idea;
};