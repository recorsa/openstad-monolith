module.exports = function( sequelize, DataTypes ) {
	var Meeting = sequelize.define('meeting', {
		date: DataTypes.DATE
	}, {
		classMethods: {
			associate: function( models ) {
				Meeting.hasMany(models.Idea);
			}
		}
	});
	
	return Meeting;
};