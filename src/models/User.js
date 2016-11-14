module.exports = function( sequelize, DataTypes ) {
	var model = sequelize.define('user', {
		uuid: {
			type         : DataTypes.UUID,
			defaultValue : DataTypes.UUIDV4,
			allowNull    : false
		},
		firstName: {
			type         : DataTypes.STRING(64),
			allowNull    : true
		},
		lastName: {
			type         : DataTypes.STRING(64),
			allowNull    : true
		},
		userName: {
			type         : DataTypes.STRING(32),
			allowNull    : true
		},
		password: {
			type         : DataTypes.STRING(255),
			allowNull    : true
		},
		email: {
			type         : DataTypes.STRING(255),
			allowNull    : true,
			validate     : {isEmail: true}
		},
		zipCode: {
			type         : DataTypes.STRING(10),
			allowNull    : true
		}
	}, {
		indexes: [{
			fields : ['uuid'],
			unique : true
		}],
		
		classMethods: {
			associate: function( models ) {
				model.hasMany(models.Idea);
				model.hasMany(models.Vote);
				model.hasMany(models.Argument);
				model.hasMany(models.ThumbsUp);
			}
		}
	});
	
	return model;
};