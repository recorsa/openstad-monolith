const config = require('config');

module.exports = function( db, sequelize, DataTypes ) {

	var BudgetVote = sequelize.define('budgetVote', {

		siteId: {
			type         : DataTypes.INTEGER,
			defaultValue : config.siteId,
			allowNull    : false,
		},

		vote: {
			type         : DataTypes.STRING,
			defaultValue : config.siteId && typeof config.siteId == 'number' ? config.siteId : null,
			allowNull    : false,
		},

	}, {

		classMethods: {

			associate: function( models ) {
				// BudgetVote.hasMany(models.Idea);
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
	
	return BudgetVote;

};
