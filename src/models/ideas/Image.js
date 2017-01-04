var co = require('co');

module.exports = function( db, sequelize, DataTypes ) {
	var Image = sequelize.define('image', {
		ideaId: {
			type      : DataTypes.INTEGER,
			allowNull : true
		},
		userId: {
			type      : DataTypes.INTEGER,
			allowNull : false
		},
		key: {
			type      : DataTypes.STRING(255),
			allowNull : false,
			validate  : {
				len: [13,255] // UNIX timestamp in ms is 13 numbers
			}
		},
		mimeType: {
			type      : DataTypes.STRING(32),
			allowNull : false
		},
		sort: {
			type         : DataTypes.INTEGER,
			allowNull    : false,
			defaultValue : 0
		},
		data: {
			type      : DataTypes.BLOB('long'),
			allowNull : false
		}
	}, {
		paranoid: false,
		
		indexes: [{
			fields : ['key'],
			unique : false
		}],
		
		classMethods: {
			associate: function( models ) {
				this.belongsTo(models.Idea);
			}
		}
	});
	
	return Image;
};