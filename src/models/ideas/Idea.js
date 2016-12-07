var co       = require('co')
  , moment   = require('moment')
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
		status: {
			type         : DataTypes.ENUM('RUNNING','ACCEPTED','DENIED','BUSY','DONE'),
			defaultValue : 'RUNNING',
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
		// Vote counts set in the default scope.
		no: {
			type         : DataTypes.VIRTUAL,
			defaultValue : 0
		},
		yes: {
			type         : DataTypes.VIRTUAL,
			defaultValue : 0
		},
		abstain: {
			type         : DataTypes.VIRTUAL,
			defaultValue : 0
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
			
			getRunningIdeas: function() {
				return this.scope('withVotes', 'running').findAll();
			},
			getHistoricIdeas: function() {
				return this.scope('withVotes', 'historic').findAll();
			}
		},
		instanceMethods: {
			addUserVote: function( user, opinion ) {
				var data = {
					ideaId  : this.id,
					userId  : user.id,
					opinion : opinion
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
				});
			},
			addUserArgument: function( user, data ) {
				var filtered = pick(data, ['sentiment', 'description']);
				filtered.ideaId = this.id;
				filtered.userId = user.id;
				return db.Argument.create(filtered);
			},
			
			setStatus: function( status ) {
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
		return {
			running: {
				where: {
					status: 'RUNNING'
				},
				order: 'endDate'
			},
			historic: {
				where: {
					status: {$not: 'RUNNING'}
				},
				order: 'endDate DESC'
			},
			
			withUser: {
				include: [{
					model      : db.User,
					attributes : ['firstName', 'lastName']
				}]
			},
			withVotes: {
				attributes: Object.keys(this.attributes).concat([
					[sequelize.literal('(SELECT COUNT(*) FROM votes v WHERE v.deletedAt IS NULL AND v.ideaId = idea.id AND v.opinion="no")'), 'no'],
					[sequelize.literal('(SELECT COUNT(*) FROM votes v WHERE v.deletedAt IS NULL AND v.ideaId = idea.id AND v.opinion="yes")'), 'yes'],
					[sequelize.literal('(SELECT COUNT(*) FROM votes v WHERE v.deletedAt IS NULL AND v.ideaId = idea.id AND v.opinion="abstain")'), 'abstain']
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