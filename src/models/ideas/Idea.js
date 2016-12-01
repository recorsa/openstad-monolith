var co     = require('co')
  , moment = require('moment');

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
			allowNull    : false
		},
		summary: {
			type         : DataTypes.TEXT,
			allowNull    : false
		},
		description: {
			type         : DataTypes.TEXT,
			allowNull    : false
		},
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
			associate: function( models ) {
				this.belongsTo(models.Meeting);
				this.belongsTo(models.User);
				this.hasMany(models.Vote);
			},
			
			getRunningIdeas: function() {
				return this.scope('defaultScope', 'running').findAll();
			}
		},
		
		scopes: {
			running: {
				where: {
					status: 'RUNNING'
				}
			}
		}
	});
	
	return Idea;
};