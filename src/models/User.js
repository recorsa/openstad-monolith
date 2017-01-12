var config      = require('config')
  , bcrypt      = require('bcrypt')
  , createError = require('http-errors');
var extend      = require('lodash/extend')
  , pick        = require('lodash/pick');
var log         = require('debug')('app:user');
var auth        = require('../auth');

module.exports = function( db, sequelize, DataTypes ) {
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
		// For unknown/anon: Always `false`.
		// For members: `true` when the user profile is complete. This is set
		//              to `false` by default, and should be set to `true`
		//              after the user has completed the registration. Until
		//              then, the 'complete registration' form should be displayed
		//              instead of any other content.
		complete: {
			type         : DataTypes.BOOLEAN,
			allowNull    : false,
			defaultValue : false
		},
		
		email: {
			type         : DataTypes.STRING(255),
			allowNull    : true,
			unique       : true,
			validate     : {isEmail: true}
		},
		password: {
			type         : DataTypes.VIRTUAL,
			allowNull    : true,
			defaultValue : null,
			validate     : {
				len: {
					args : [6,64],
					msg  : 'Wachtwoord moet tussen 6 en 64 tekens zijn'
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
			set          : function( hashObject ) {
				var hash = hashObject ? JSON.stringify(hashObject) : null;
				this.setDataValue('passwordHash', hash);
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
		fullName: {
			type         : DataTypes.VIRTUAL,
			allowNull    : true,
			get          : function() {
				return this.getDataValue('firstName')+' '+this.getDataValue('lastName');
			}
		},
		gender: {
			type         : DataTypes.ENUM('male', 'female'),
			allowNull    : true
		},
		zipCode: {
			type         : DataTypes.STRING(10),
			allowNull    : true,
			validate     : {
				is: {
					args : [/^\d{4} ?\w{2}$/],
					msg  : 'Ongeldige postcode'
				}
			},
			set          : function( zipCode ) {
				zipCode = zipCode != null ?
				          String(zipCode).trim() :
				          null;
				this.setDataValue('zipCode', zipCode);
			}
		}
	}, {
		validate: {
			hasValidUserRole: function() {
				if( this.id !== 1 && this.role === 'unknown' ) {
					throw new Error('User role \'unknown\' is not allowed');
				}
			},
			isValidAnon: function() {
				if( this.role === 'unknown' || this.role === 'anonymous' ) {
					if( this.complete || this.email ) {
						throw new Error('Anonymous users cannot be complete profiles or have a mail address');
					}
				}
			},
			isValidMember: function() {
				if( this.role !== 'unknown' && this.role !== 'anonymous' ) {
					if( !this.email ) {
						throw new Error('Email address is required for members');
					} else if( this.complete && (!this.firstName || !this.lastName) ) {
						throw new Error('First- and last name are required for members');
					}
				}
			},
			onlyMembersCanLogin: function() {
				if( this.role === 'unknown' || this.role === 'anonymous' ) {
					if( this.passwordHash ) {
						throw new Error('Anonymous profiles cannot have login credentials');
					}
				}
			}
		},
		classMethods: {
			associate: function( models ) {
				this.hasMany(models.Idea);
				this.hasMany(models.Vote);
				this.hasMany(models.Argument);
				this.hasMany(models.ThumbsUp);
			},
			findByCredentials: function( email, password ) {
				if( !email || !password ) {
					return Promise.reject(createError(400, 'Incomplete credentials'));
				}
				
				return this.findOne({where: {email: email}}).then(function( user ) {
					if( !user || !user.authenticate(password) ) {
						// TODO: AuthenticationError
						throw createError(403, 'Login failed');
					} else {
						return user;
					}
				});
			},
			findMember: function( email ) {
				if( !email ) {
					return Promise.reject(createError(400, 'No email address'));
				}
				
				return this.findOne({where: {email: email}});
			},
			
			registerAnonymous: function( zipCode ) {
				return this.create({
					role    : 'anonymous',
					zipCode : zipCode
				});
			},
			registerMember: function( user, email ) {
				var data = {
					role  : 'member',
					email : email
				};
				
				return User.findMember(email)
				.then(function( existingUser ) {
					if( existingUser ) {
						throw createError(400, 'Dit e-mail adres is al in gebruik');
					}
					
					if( user.isAnonymous() ) {
						return user.update(data);
					} else {
						return User.findOrCreate({
							where    : {email: data.email},
							defaults : data
						})
						.spread(function( actualUser ) {
							if( actualUser.hasCompletedRegistration() ) {
								throw createError(400, 'Dit e-mail adres is al in gebruik');
							}
							return actualUser;
						});
					}
				});
			}
		},
		instanceMethods: {
			completeRegistration: function( data ) {
				var filtered = pick(data, [
					'firstName', 'lastName', 'zipCode', 'gender', 'password'
				]);
				filtered.complete = true;
				return this.update(filtered);
			},
			
			authenticate: function( password ) {
				var method = config.get('security.passwordHashing.currentMethod');
				if( !this.passwordHash ) {
					log('user %d has no passwordHash', this.id);
					return false;
				} else {
					var hash   = JSON.parse(this.passwordHash);
					var result = Password[method].compare(password, hash);
					log('authentication for user %d %s', this.id, result ? 'succeeded' : 'failed');
					return result;
				}
			},
			hasCompletedRegistration: function() {
				return this.isMember() && this.email && this.complete;
			},
			isUnknown: function() {
				return this.role === 'unknown';
			},
			isAnonymous: function() {
				return this.role === 'anonymous';
			},
			isMember: function() {
				return this.role !== 'unknown' && this.role !== 'anonymous';
			},
			isLoggedIn: function() {
				return this.id && this.id !== 1 && this.isMember();
			},
			can: function( actionName /* [, resource...] */ ) {
				var user = auth.user(this);
				if( arguments.length > 1 ) {
					var resources = Array.from(arguments).slice(1);
					var args      = [actionName].concat(resources);
					return user.can.apply(user, args);
				} else {
					return user.can(actionName);
				}
			},
			
			createNewIdea: function( data ) {
				var imageKeys = data.images;
				var filtered  = pick(data, ['title', 'summary', 'description', 'location']);
				filtered.userId    = this.id;
				filtered.startDate = Date.now();
				
				return db.Idea.create(filtered)
				.then(function( idea ) {
					return idea.updateImages(imageKeys);
				});
			},
			updateIdea: function( idea, data ) {
				var imageKeys = data.images;
				var filtered  = pick(data, ['title', 'summary', 'description', 'location']);
				
				return idea.update(filtered)
				.then(function() {
					return idea.updateImages(imageKeys);
				});
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