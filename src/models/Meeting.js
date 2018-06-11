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
// 12 september 2017 - peildatum
// 26 september 2017 - vergaderdatum
// 10 oktober 2017 - peildatum
// 31 oktober 2017 - vergaderdatum
// 14 november 2017 - peildatum
// 28 november 2017 - vergaderdatum + peildatum
// 12 december 2017 - peildatum

module.exports = function( db, sequelize, DataTypes ) {
	var Meeting = sequelize.define('meeting', {
		type : DataTypes.ENUM('selection','meeting'),
		date : DataTypes.DATE,
		finished: {
			type: DataTypes.VIRTUAL,
			get: function() {
				return this.date < +new Date;
			}
		}
	}, {
		classMethods: {
			associate: function( models ) {
				Meeting.hasMany(models.Idea);
			},
			scopes: function() {
				return {
					withIdea: {
						include: {
							model: db.Idea,
							attributes: ['id', 'title']
						}
					}
				};
			},
			
			getUpcoming: function( limit ) {
				if( !limit ) limit = 4;
				return this.scope('withIdea')
				.findAll({
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