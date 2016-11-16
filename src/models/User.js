module.exports = function( sequelize, DataTypes ) {
	var User = sequelize.define('user', {
		uuid: {
			type         : DataTypes.UUID,
			defaultValue : DataTypes.UUIDV4,
			allowNull    : false
		},
		userName: {
			type         : DataTypes.STRING(32),
			allowNull    : true
		},
		password: {
			type         : DataTypes.STRING(255),
			allowNull    : true
		},
		firstName: {
			type         : DataTypes.STRING(64),
			allowNull    : true
		},
		lastName: {
			type         : DataTypes.STRING(64),
			allowNull    : true
		},
		gender: {
			type         : DataTypes.ENUM('male', 'female'),
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
				User.hasMany(models.Idea);
				User.hasMany(models.Vote);
				User.hasMany(models.Argument);
				User.hasMany(models.ThumbsUp);
			}
		}
	});
	
	return User;
};
