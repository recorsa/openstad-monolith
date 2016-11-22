var config = require('config')
  , bcrypt = require('bcrypt');
var errors = require('../errors');

module.exports = function( sequelize, DataTypes ) {
	var User = sequelize.define('user', {
		userName: {
			type         : DataTypes.STRING(32),
			allowNull    : true,
			unique       : true
		},
		password: {
			type         : DataTypes.VIRTUAL,
			allowNull    : true,
			validate     : {
				len: {
					args: [6,64],
					msg: 'Password must be between 6 to 64 characters'
				}
			},
			set          : function( password ) {
				var method = config.get('security.passwordHashing.currentMethod');
				this.setDataValue('password', password);
				this.set('passwordHash', password ?
				                         Password[method].hash(password) :
				                         null
				);
			}
		},
		passwordHash: {
			type         : DataTypes.TEXT,
			allowNull    : true,
			get          : function() {
				var hashObject = this.getDataValue('passwordHash');
				return hashObject ?
				       JSON.parse(this.getDataValue('passwordHash')) :
				       null;
			},
			set          : function( hashObject ) {
				this.setDataValue('passwordHash', hashObject ? JSON.stringify(hashObject) : null);
			}
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
		validate: {
			loginCredentials: function() {
				if( (this.userName === null) !== (this.passwordHash === null) ) {
					throw new Error('Both userName and password must be set');
				}
			}
		},
		classMethods: {
			associate: function( models ) {
				User.hasMany(models.Idea);
				User.hasMany(models.Vote);
				User.hasMany(models.Argument);
				User.hasMany(models.ThumbsUp);
			},
			findByCredentials: function( userName, password ) {
				return User.findOne({userName: userName}).then(function( user ) {
					if( !user.authenticate(password) ) {
						// TODO: AuthenticationError
						throw new errors.UnauthorizedError('Login failed');
					} else {
						return user;
					}
				});
			}
		},
		instanceMethods: {
			authenticate: function( password ) {
				var method = config.get('security.passwordHashing.currentMethod');
				return Password[method].compare(password, this.passwordHash);
			}
		}
	});
	
	return User;
};

var Password = {
	bcrypt: {
		hash: function( password ) {
			var cost = config.get('security.passwordHashing.methods.bcrypt.cost');
			var salt = bcrypt.genSaltSync(cost);
			var hash = bcrypt.hashSync(password, salt);
			return {
				method : 'bcrypt',
				cost   : cost,
				salt   : salt,
				hash   : hash
			};
		},
		compare: function( password, hashObject ) {
			return bcrypt.compareSync(password, hashObject.hash);
		}
	}
}