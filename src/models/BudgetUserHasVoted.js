const config = require('config');

module.exports = function( db, sequelize, DataTypes ) {

	var BudgetUserHasVoted = sequelize.define('budgetUserHasVoted', {

		siteId: {
			type         : DataTypes.INTEGER,
			defaultValue : config.siteId,
			allowNull    : false,
		},

		userId: {
			type         : DataTypes.STRING,
			allowNull    : false,
		},

	}, {

		classMethods: {

			associate: function( models ) {
				// BudgetUserHasVoted.hasMany(models.Idea);
			},

			scopes: function() {

				let siteScope;
				if (config.siteId && typeof config.siteId == 'number') {
					siteScope = {
						where: {
							siteId: config.siteId,
						}
					}
				}
				
				return {
					siteScope,
					// withIdea: {
					//  	include: {
					//  		model: db.Idea,
					//  		attributes: ['id', 'title']
					//  	}
					// }
				};
			},
			
		},

		instanceMethods: {
		},

	});
	
	return BudgetUserHasVoted;

};
