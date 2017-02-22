// 14 februari 2017 - peildatum
// 7 maart 2017 - vergaderdatum
// 21 maart 2017 - peildatum
// 4 april 2017 - vergaderdatum
// 18 april 2017 - peildatum
// 9 mei 2017 - vergaderdatum
// 23 mei, 2017 - peildatum
// 6 juni 2017 - vergaderdatum
// 20 juni 2017 - peildatum
// 4 juli 2017 - vergaderdatum & peildatum ?
// 18 juli 2017 - vergaderdatum
// 
// begin september een peildatum afspreken?
// 
// 12 september 2017 - vergaderdatum
// 26 september 2017 - peildatum
// 10 oktober 2017 - vergaderdatum 
// 31 oktober 2017 - peildatum
// 14 november 2017 - vergaderdatum
// 28 november 2017 - peildatum
// 12 december 2017 - vergaderdatum

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