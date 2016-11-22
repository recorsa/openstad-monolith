var config = require('config')
  , bcrypt = require('bcrypt');
var log    = require('debug')('app:user');
var errors = require('../errors');

module.exports = function( sequelize, DataTypes ) {
	var User = sequelize.define('user', {
		role: {
			type         : DataTypes.STRING(32),
			allowNull    : false,
			defaultValue : 'anonymous',
			validate     : {
				isIn: {
					args : [['unknown', 'anonymous', 'member', 'admin', 'su']],
					msg  : 'Unknown user role'
				}
			}
		},
		userName: {
			type         : DataTypes.STRING(32),
			allowNull    : true,
			defaultValue : null,
			unique       : true
		},
		password: {
			type         : DataTypes.VIRTUAL,
			allowNull    : true,
			defaultValue : null,
			validate     : {
				len: {
					args : [6,64],
					msg  : 'Password must be between 6 to 64 characters'
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
			},
			validUserRole: function() {
				if( this.id != 1 && this.role == 'unknown' ) {
					throw new Error('User role \'unknown\' is not allowed');
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
				return User.findOne({where: {userName: userName}}).then(function( user ) {
					if( !user || !user.authenticate(password) ) {
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
				if( !this.passwordHash ) {
					log('user %d has no passwordHash', this.id);
					return false;
				} else {
					var result = Password[method].compare(password, this.passwordHash);
					log('authentication for user %d %s', this.id, result ? 'succeeded' : 'failed');
					return result;
				}
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