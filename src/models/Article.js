var sanitize   = require('../util/sanitize');
var ImageOptim = require('../ImageOptim');
const config = require('config');

module.exports = function( db, sequelize, DataTypes ) {
	var Article = sequelize.define('article', {

		siteId: {
			type         : DataTypes.INTEGER,
			defaultValue : config.siteId && typeof config.siteId == 'number' ? config.siteId : 0,
		},

		userId: {
			type         : DataTypes.INTEGER,
			allowNull    : true
		},

		image: {
			type         : DataTypes.STRING(255),
			allowNull    : true
		},

		imageCaption: {
			type         : DataTypes.STRING(255),
			allowNull    : true,
			set          : function( text ) {
				this.setDataValue('imageCaption', sanitize.noTags(text));
			}
		},

		video: {
			type         : DataTypes.TEXT,
			allowNull    : true,
			get          : function() {
				var raw = this.getDataValue('video');
				return raw ? JSON.parse(raw) : null;
			}
		},

		seqnr: {
			type         : DataTypes.INTEGER,
			allowNull    : true
		},

		title: {
			type         : DataTypes.STRING(255),
			allowNull    : false,
			set          : function( text ) {
				this.setDataValue('title', sanitize.title(text));
			}
		},

		posterImageUrl: {
			type         : DataTypes.VIRTUAL,
			get          : function() {
				var posterImage = this.get('posterImage');
				var location    = this.get('location');
				
				return posterImage ? `/image/${posterImage.key}?thumb` :
				       location    ? 'https://maps.googleapis.com/maps/api/streetview?'+
				                     'size=800x600&'+
				                     `location=${location.coordinates[0]},${location.coordinates[1]}&`+
				                     'heading=151.78&pitch=-0.76&key={{config.openStadMap.googleKey}}'
				                   : null;
			}
		},
		summary: {
			type         : DataTypes.TEXT,
			allowNull    : false,
			set          : function( text ) {
				this.setDataValue('summary', sanitize.safeTags(text));
			}
		},
		intro: {
			type         : DataTypes.TEXT,
			allowNull    : true,
			set          : function( text ) {
				this.setDataValue('intro', sanitize.safeTags(text));
			}
		},
		quote: {
			type         : DataTypes.STRING(255),
			allowNull    : true,
			set          : function( text ) {
				this.setDataValue('quote', sanitize.noTags(text));
			}
		},
		description: {
			type         : DataTypes.TEXT,
			allowNull    : false,
			set          : function( text ) {
				this.setDataValue('description', sanitize.safeTags(text));
			}
		},
		isPublished: {
			type         : DataTypes.BOOLEAN,
			allowNull    : false,
			defaultValue : false
		},
		date: {
			type         : DataTypes.DATE,
			allowNull    : true,
			set(date) {
				this.setDataValue('date', (date => {
					try {
						date = new Date(date).toISOString();
					} catch(err) {
						date = new Date().toISOString();
					}
					return date;
				})(date));
			}
		}
	}, {
		classMethods: {
			scopes: scopes,
			associate: function( models ) {
				this.belongsTo(models.User);
				this.hasMany(models.Image);
				this.hasOne(models.Image, {as: 'posterImage'});
			},
			
			getAllTiles: function() {
				return this.scope('asTile').findAll();
			},
			getTilesForUser: function( user ) {
				if( user.can('article:edit') ) {
					return this.getAllTiles();
				} else {
					return this.scope('asTile').findAll({
						where: {isPublished: true}
					});
				}
			}
		},
		instanceMethods: {
			updateImages: function( imageKeys ) {
				var self = this;
				if( !imageKeys || !imageKeys.length ) {
					imageKeys = [''];
				}
				
				var articleId  = this.id;
				var queries = [
					db.Image.destroy({
						where: {
							articleId : articleId,
							key       : {$notIn: imageKeys}
						}
					})
				].concat(
					imageKeys.map(function( imageKey, sort ) {
						return db.Image.update({
							articleId : articleId,
							sort      : sort
						}, {
							where: {key: imageKey}
						});
					})
				);
				
				return Promise.all(queries).then(function() {
					ImageOptim.processArticle(self.id);
					return self;
				});
			}
		}
	});
	
	function scopes() {

		let defaultScope = {
			include: [{
				model      : db.User,
				attributes : ['firstName', 'lastName']
			}]
		}

		if (config.siteId && typeof config.siteId == 'number') {
			defaultScope = {
				where:
				{
					$and: [
						{ siteId: config.siteId },
					]
				}
			}
		}
		
		return {
			defaultScope,
			asTile: {
				attributes: ['id', 'image', 'title', 'summary', 'isPublished', 'seqnr'],
				include: [{
					model      : db.Image,
					as         : 'posterImage',
					attributes : ['key'],
					required   : false,
					where      : {
						sort: 0
					}
				}],
				order: 'article.seqnr, article.createdAt DESC'
			},
			withPosterImage: {
				include: [{
					model      : db.Image,
					as         : 'posterImage',
					attributes : ['key'],
					required   : false,
					where      : {
						sort: 0
					}
				}]
			},
		};
	}
	
	return Article;
};
