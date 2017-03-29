var co            = require('co')
  , config        = require('config')
  , moment        = require('moment-timezone')
  , pick          = require('lodash/pick')
  , Promise       = require('bluebird');

var sanitize      = require('../../util/sanitize');
var ImageOptim    = require('../../ImageOptim');
var notifications = require('../../notifications');

module.exports = function( db, sequelize, DataTypes ) {
	var Idea = sequelize.define('idea', {
		meetingId: {
			type         : DataTypes.INTEGER,
			allowNull    : true
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
		duration: {
			type         : DataTypes.VIRTUAL,
			get          : function() {
				if( this.getDataValue('status') != 'OPEN' ) {
					return 0;
				}
				
				var now     = moment();
				var endDate = this.getDataValue('endDate');
				return Math.max(0, moment(endDate).diff(Date.now()));
			}
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
			validate     : {
				len: {
					args : [10,140],
					msg  : 'Titel moet tussen 10 en 140 tekens lang zijn'
				}
			},
			set          : function( text ) {
				this.setDataValue('title', sanitize.title(text));
			}
		},
		summary: {
			type         : DataTypes.TEXT,
			allowNull    : false,
			validate     : {
				len: {
					args : [20,140],
					msg  : 'Samenvatting moet tussen 20 en 140 tekens zijn'
				}
			},
			set          : function( text ) {
				this.setDataValue('summary', sanitize.summary(text));
			}
		},
		description: {
			type         : DataTypes.TEXT,
			allowNull    : false,
			validate     : {
				len: {
					args : [140,],
					msg  : 'Beschrijving moet minimaal 140 tekens lang zijn'
				}
			},
			set          : function( text ) {
				this.setDataValue('description', sanitize.content(text));
			}
		},
		location: {
			type         : DataTypes.GEOMETRY('POINT'),
			allowNull    : true
		},
		
		modBreak: {
			type         : DataTypes.TEXT,
			allowNull    : true,
			set          : function( text ) {
				this.setDataValue('modBreak', sanitize.content(text));
			}
		},
		modBreakUserId: {
			type         : DataTypes.INTEGER,
			allowNull    : true
		},
		modBreakDate: {
			type         : DataTypes.DATE,
			allowNull    : true
		},
		// Counts set in `summary`/`withVoteCount` scope.
		no: {
			type         : DataTypes.VIRTUAL
		},
		yes: {
			type         : DataTypes.VIRTUAL
		},
		progress: {
			type         : DataTypes.VIRTUAL,
			get          : function() {
				var minimumYesVotes = config.get('ideas.minimumYesVotes');
				var yes             = this.getDataValue('yes');
				return yes !== undefined ?
				       Number((Math.min(1, (yes / minimumYesVotes)) * 100).toFixed(2)) :
				       undefined;
			}
		},
		argCount: {
			type         : DataTypes.VIRTUAL
		}
	}, {
		hooks: {
			beforeValidate: co.wrap(function*( idea, options ) {
				// Automatically determine `endDate`, and `meetingId`.
				if( idea.changed('startDate') ) {
					var duration = config.get('ideas.duration');
					var endDate  = moment(idea.startDate).add(duration, 'days').toDate();
					var meeting  = yield sequelize.models.meeting.findOne({
						where: {
							date: {$gt: endDate}
						},
						order: 'date ASC'
					});
					
					idea.setDataValue('endDate', endDate);
					if( meeting ) {
						idea.setDataValue('meetingId', meeting.id);
					}
				}
			})
		},
		validate: {
			validDeadline: function() {
				if( this.endDate - this.startDate < 43200000 ) {
					throw Error('An idea must run at least 1 day');
				}
			},
			validModBreak: function() {
				if( this.modBreak && (!this.modBreakUserId || !this.modBreakDate) ) {
					throw Error('Incomplete mod break');
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
				this.hasOne(models.Image, {as: 'posterImage'});
			},
			
			getHighlighted: function() {
				return this.scope('summary').findAll({
					where : {status: 'OPEN'},
					order : 'sort, endDate DESC',
					limit : 3
				});
			},
			getRunning: function( limit ) {
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
				return this.scope('summary', 'withPosterImage').findAll({
					where: {
						$or: [
							{status: {$in: ['OPEN', 'CLOSED']}},
							// {
							// 	$and: [
							// 		{status: 'DENIED'},
									sequelize.where(db.Meeting.rawAttributes.date, '>=', new Date())
							// 	]
							// }
						]
					},
					order   : `
						CASE status
							WHEN 'ACCEPTED' THEN 4
							WHEN 'BUSY' THEN 3
							WHEN 'DONE' THEN 2
							WHEN 'DENIED' THEN 0
							ELSE 1
						END DESC,
						endDate DESC
					`,
					include : [{
						model: db.Meeting,
						attributes: []
					}],
					limit   : limit
				});
			},
			getHistoric: function() {
				return this.scope('summary').findAll({
					where: {
						status: {$notIn: ['OPEN', 'CLOSED']}
					},
					order: 'updatedAt DESC'
				});
			}
		},
		instanceMethods: {
			getUserVote: function( user ) {
				return db.Vote.findOne({
					attributes: ['opinion'],
					where: {
						ideaId : this.id,
						userId : user.id
					}
				});
			},
			isOpen: function() {
				return this.status === 'OPEN';
			},
			isRunning: function() {
				return this.status === 'OPEN'     ||
				       this.status === 'CLOSED'   ||
				       this.status === 'ACCEPTED' ||
				       this.status === 'BUSY'
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
				return db.Argument.create(filtered)
				.tap(function( argument ) {
					notifications.trigger(user.id, 'arg', argument.id, 'create');
				});
			},
			updateUserArgument: function( user, argument, description ) {
				return argument.update({
					description: description
				})
				.tap(function( argument ) {
					notifications.trigger(user.id, 'arg', argument.id, 'update');
				});
			},
			
			setModBreak: function( user, modBreak ) {
				return this.update({
					modBreak       : modBreak,
					modBreakUserId : user.id,
					modBreakDate   : new Date()
				});
			},
			setStatus: function( status ) {
				var minimumYesVotes = config.get('ideas.minimumYesVotes');
				if( this.yes === undefined ) {
					throw Error('Idea.setStatus needs scope `withVoteCount`');
				}
				if( status === 'CLOSED' && this.yes < minimumYesVotes ) {
					status = 'DENIED';
				}
				return this.update({status: status});
			},
			
			updateImages: function( imageKeys ) {
				var self = this;
				if( !imageKeys || !imageKeys.length ) {
					imageKeys = [''];
				}
				
				var ideaId  = this.id;
				var queries = [
					db.Image.destroy({
						where: {
							ideaId : ideaId,
							key    : {$notIn: imageKeys}
						}
					})
				].concat(
					imageKeys.map(function( imageKey, sort ) {
						return db.Image.update({
							ideaId : ideaId,
							sort   : sort
						}, {
							where: {key: imageKey}
						});
					})
				);
				
				return Promise.all(queries).then(function() {
					ImageOptim.processIdea(self.id);
					return self;
				});
			}
		}
	});
	
	function scopes() {
		// Helper function used in `withVoteCount` scope.
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
					attributes : ['firstName', 'lastName', 'email']
				}]
			},
			withVoteCount: {
				attributes: Object.keys(this.attributes).concat([
					voteCount('yes'),
					voteCount('no')
				])
			},
			withPosterImage: {
				include: [{
					model      : db.Image,
					as         : 'posterImage',
					attributes : ['key'],
					required   : false,
					where      : {
						sort: 0
					}
				}]
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