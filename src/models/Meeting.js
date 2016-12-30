module.exports = function( db, sequelize, DataTypes ) {
	var Meeting = sequelize.define('meeting', {
		date: DataTypes.DATE
	}, {
		classMethods: {
			associate: function( models ) {
				Meeting.hasMany(models.Idea);
			},
			
			getUpcoming: function( limit ) {
				return this.findAll({
					where: {
						date: {$gte: new Date()}
					},
					limit: limit
				})
			}
		}
	});
	
	return Meeting;
};