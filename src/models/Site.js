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
				return this.parseConfig(value);
			},
			set          : function(value) {
				this.setDataValue('config', this.parseConfig(value));
			}
		},

	}, {

		classMethods: {

			scopes: scopes,

			associate: function( models ) {
				this.hasMany(models.Idea);
			},
			
		},

		instanceMethods: {

			parseConfig: function(config) {

				try {
					if (typeof config == 'string') {
						config = JSON.parse(config);
					}
				} catch(err) {
					config = {};
				}

				// defaults
				config.type = config.type || 'stemvan';

				config.votes = config.votes || {};
				config.votes.userRole = config.votes.userRole || 'anonymous';
				config.votes.maxChoices = config.votes.maxChoices || ( config.type == 'stemvan' ? 1 : 3 );
				config.votes.replaceOrError = config.votes.replaceOrError || 'replace';

				return config;

			}
			
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
