module.exports = function( sequelize, DataTypes ) {
	var model = sequelize.define('idea', {
		meetingId: DataTypes.INTEGER,
		userId: DataTypes.INTEGER,
		startDate: {
			type         : DataTypes.DATE,
			allowNull    : false
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
		validate: {
			validDeadline: function() {
				if( this.endDate - this.startDate < 86400000 ) {
					throw new Error('An idea must run at least 1 day');
				}
				if( Date.now() - this.startDate > 3600000 ) {
					throw new Error('Ideas are for the present, not the past!')
				}
			}
		},
		classMethods: {
			associate: function( models ) {
				model.belongsTo(models.Meeting);
				model.belongsTo(models.User);
			}
		}
	});
	
	return model;
};