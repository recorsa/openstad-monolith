var sanitize   = require('../util/sanitize');
var ImageOptim = require('../ImageOptim');

module.exports = function( db, sequelize, DataTypes ) {

	var Site = sequelize.define('site', {

		name: {
			type         : DataTypes.STRING(255),
			allowNull    : true,
			defaultValue : 'Nieuwe site',
		},

		title: {
			type         : DataTypes.STRING(255),
			allowNull    : true,
			defaultValue : 'Nieuwe site',
		},

		config: {
			type         : DataTypes.JSON,
			allowNull    : false,
			defaultValue : {},
			get          : function() {
				// for some reaason this is not always done automatically
				let value = this.getDataValue('config');
        try {
					if (typeof value == 'string') {
						value = JSON.parse(value);
					}
				} catch(err) {}
				return value;
			},
		},

	}, {

		classMethods: {

			scopes: scopes,

			associate: function( models ) {
				this.hasMany(models.Idea);
			},
			
		},

		instanceMethods: {

		}

	});
	
	function scopes() {
		return {
			defaultScope: {
			},
		};
	}
	
	return Site;
};
