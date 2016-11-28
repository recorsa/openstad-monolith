var co     = require('co')
  , moment = require('moment');

module.exports = function( sequelize, DataTypes ) {
	var Idea = sequelize.define('idea', {
		meetingId: DataTypes.INTEGER,
		userId: DataTypes.INTEGER,
		startDate: {
			type         : DataTypes.DATE,
			allowNull    : false,
			// `startDate` must at least be the current server time.
			set          : function( date ) {
				this.setDataValue('startDate', Math.max(Date.now(), date));
			}
		},
		endDate: {
			type         : DataTypes.DATE,
			allowNull    : true
		},
		status: {
			type         : DataTypes.ENUM('running','accepted','denied','busy','done'),
			defaultValue : 'running',
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
				// Automatically determine `endDate`, and the relevant meeting
				// in which this idea might be discussed.
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
				Idea.belongsTo(models.Meeting);
				Idea.belongsTo(models.User);
				Idea.hasMany(models.Vote);
			},
			
			getRunningIdeas: function() {
				return Idea.scope('running').findAll();
			}
		},
		
		scopes: {
			running: {
				where: {
					status: 'running'
				}
			}
		}
	});
	
	return Idea;
};