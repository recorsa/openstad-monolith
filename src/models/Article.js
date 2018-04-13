var sanitize = require('../util/sanitize');

module.exports = function( db, sequelize, DataTypes ) {
	var Article = sequelize.define('article', {
		userId: {
			type         : DataTypes.INTEGER,
			allowNull    : true
		},
		image: {
			type         : DataTypes.STRING(255),
			allowNull    : true
		},
		video: {
			type         : DataTypes.TEXT,
			allowNull    : true,
			get          : function() {
				var raw = this.getDataValue('video');
				return raw ? JSON.parse(raw) : null;
			}
		},
		title: {
			type         : DataTypes.STRING(255),
			allowNull    : false,
			set          : function( text ) {
				this.setDataValue('title', sanitize.noTags(text));
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
				                     'heading=151.78&pitch=-0.76&key=AIzaSyCrp_kqFQoKEaW5DOEBVjAu61cRl3-T0Lg'
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
		}
	}, {
		classMethods: {
			scopes: scopes,
			associate: function( models ) {
				this.belongsTo(models.User);
				this.hasMany(models.Image);
				this.hasOne(models.Image, {as: 'posterImage'});
			},
			
			getTiles: function() {
				return this.scope('asTile').findAll();
			},

			updateImages: function( imageKeys ) {
				var self = this;
				if( !imageKeys || !imageKeys.length ) {
					imageKeys = [''];
				}
				
				var ideaId  = this.id;
				var queries = [
					db.Image.destroy({
						where: {
							ideaId : ideaId,
							key    : {$notIn: imageKeys}
						}
					})
				].concat(
					imageKeys.map(function( imageKey, sort ) {
						return db.Image.update({
							ideaId : ideaId,
							sort   : sort
						}, {
							where: {key: imageKey}
						});
					})
				);
				
				return Promise.all(queries).then(function() {
					ImageOptim.processIdea(self.id);
					return self;
				});
      },
      
    }
	});
	
	function scopes() {
		return {
			defaultScope: {
				include: [{
					model      : db.User,
					attributes : ['firstName', 'lastName']
				}]
			},
			asTile: {
				attributes: ['id', 'image', 'title', 'summary'],
				include: [{
					model      : db.Image,
					as         : 'posterImage',
					attributes : ['key'],
					required   : false,
					where      : {
						sort: 0
					}
				}],
				order: 'article.createdAt DESC'
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
