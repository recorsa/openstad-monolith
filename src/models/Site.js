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

			configOptions: function () {
				// definition of possible config values
				// todo: formaat gelijktrekken met sequelize defs
				// todo: je zou ook opties kunnen hebben die wel een default hebbe maar niet editable zijn? apiUrl bijv. Of misschien is die afgeleid
				return {
					type: { // this a temporary catch-all-and-set-defaults
						type: 'enum',
						values: ['stemtool', 'stemvan'],
						default: 'stemvan',
						allowNull: false,
					},
					url: {
						type: 'string',
						default: 'https://openstad-api.amsterdam.nl',
					},
					hostname: {
						type: 'string',
						default: 'openstad-api.amsterdam.nl',
					},
					ideas: {
						type: 'object',
						subset: {
							noOfColumsInList: {
								type: 'int',
								default: 4,
							}
						}
					},
					arguments: {
							type: 'object',
							subset: {
								new: {
									type: 'object',
									subset: {
										anonymousAllowed: {
											type: 'boolean',
											default: false,
										},
										showFields: {
											type: 'arrayOfStrings', // eh...
											default: ['zipCode', 'nickName'],
										}
									}
								}
							}
					},
					votes: {
						type: 'object',
						subset: {
							maxChoices: {
								type: 'int',
								default: 1,
							},
							userRole: {
								type: 'string',
								default: 'anonymous',
							},
							replaceOrError: {
								type: 'string',
								default: 'replace',
							},
						},
					},
				}
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

				let options = Site.configOptions();

				config = checkValues(config, options)

				return config;

				function checkValues(value, options) {

					let newValue = {};
					Object.keys(options).forEach( key => {

						if (options[key].type == 'object' && options[key].subset) {
							let temp = checkValues(value[key] || {}, options[key].subset); // recusion
							return newValue[key] = Object.keys(temp) ? temp : undefined;
						}

						// TODO: in progress
						if (value[key]) {
							if (options[key].type && options[key].type === 'int' && parseInt(value[key]) !== value[key]) {
								throw new Error(`site.config: ${key} must be an int`);
							}
							if (options[key].type && options[key].type === 'string' && typeof value[key] !== 'string') {
								throw new Error(`site.config: ${key} must be an int`);
							}
							if (options[key].type && options[key].type === 'boolean' && typeof value[key] !== 'boolean') {
								throw new Error(`site.config: ${key} must be an boolean`);
							}
							if (options[key].type && options[key].type === 'arrayOfStrings' && !(typeof value[key] === 'object' && Array.isArray(value[key]) && !value[key].find(val => typeof val !== 'string'))) {
								throw new Error(`site.config: ${key} must be an arry of strings`);
							}
							if (options[key].type && options[key].type === 'enum' && options[key].values && options[key].values.indexOf(value[key]) == -1) {
								throw new Error(`site.config: ${key} has an invalid value`);
							}
							console.log(key, value[key])
							return newValue[key] = value[key];

						}

						// default?
						if (typeof options[key].default != 'undefined') {
							return newValue[key] = options[key].default
						}

						// allowNull?
						if (!newValue[key] && options[key].allowNull === false) {
							throw new Error(`site.config: $key must be defined`);
						}

					});
					return newValue;
				}

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
