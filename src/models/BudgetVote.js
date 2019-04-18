const config = require('config');

module.exports = function( db, sequelize, DataTypes ) {

	var BudgetVote = sequelize.define('budgetVote', {

		siteId: {
			type         : DataTypes.INTEGER,
			defaultValue : config.siteId && typeof config.siteId == 'number' ? config.siteId : 0,
		},

		userId: {
			type         : DataTypes.STRING,
			defaultValue : null,
			allowNull    : 0,
		},

		userIp: {
			type         : DataTypes.STRING(64),
			allowNull    : true,
			validate     : {
				isIP: true
			}
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

				let scopes = {};

				if (config.siteId && typeof config.siteId == 'number') {
					scopes.siteScope = {
						where: {
							siteId: config.siteId,
						}
					}
				}
				
				return scopes;
			},
			
		},

		instanceMethods: {
		},

	});
	
	return BudgetVote;

};
