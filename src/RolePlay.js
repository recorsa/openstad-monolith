var ary         = require('lodash/ary');
var defaults    = require('lodash/defaults');
var extend      = require('lodash/extend');
var forOwn      = require('lodash/forOwn');
var createError = require('http-errors');

// options = {
// 	defaultRoleName: string
// }
var RolePlay = module.exports = function RolePlay( options ) {
	options = defaults(options, {});
	
	this.roles       = {};
	this.defaultRole = new this.constructor.Role(this, options.defaultRoleName || 'default');
	this.roles[this.defaultRole.name] = this.defaultRole;
};
RolePlay.Role = Role;
RolePlay.Play = Play;

extend(RolePlay.prototype, {
	defaultRole : undefined,
	roles       : undefined,
	
	can: function( actionName ) {
		var self = this;
		return function( req, res, next ) {
			if( !req.user ) {
				return next(createError(403, 'Roleplay: No user'));
			}
			
			var user = self.user(req.user);
			var can  = user.can(actionName);
			var isAllowed;
			if( can.resource ) {
				if( !req.resource ) {
					return next(new Error('Action needs resource: '+actionName));
				}
				isAllowed = can.resource(req.resource);
			} else {
				isAllowed = can;
			}
			
			isAllowed.then(function( allowed ) {
				if( allowed ) {
					next();
				} else {
					next(createError(403, 'Not authorized'));
				}
			})
			.catch(next);
		}
	},
	
	role: function( roleName ) {
		var role;
		if( roleName instanceof Role ) {
			role     = roleName;
			roleName = role.name;
		}
		
		if( this.roles[roleName] ) {
			if( role && this.roles[roleName] !== role ) {
				throw new Error('Duplicate role: '+roleName);
			}
			return this.roles[roleName];
		} else {
			if( !role ) {
				role = this.defaultRole.role(roleName);
			}
			return this.roles[roleName] = role;
		}
	},
	
	user: function( user ) {
		return new this.constructor.Play(this, user);
	},
	
	gatherAction: function( actionName, roleName ) {
		var result = undefined;
		var role   = this.roles[roleName];
		var action;
		if( !role ) {
			throw new Error('Role not found: '+roleName);
		}
		
		while( role ) {
			if( action = role.action(actionName) ) {
				result = defaults(result || {}, action);
			}
			role = role.inherits;
		}
		return result;
	}
});

function Role( mgr, roleName ) {
	this.mgr     = mgr;
	this.name    = roleName;
	this.actions = {};
}
extend(Role.prototype, {
	mgr      : undefined,
	name     : undefined,
	actions  : undefined,
	inherits : undefined,
	
	role: function( roleName ) {
		var role = new this.constructor(this.mgr, roleName);
		role.inherits = this;
		return this.mgr.role(role);
	},
	
	// def = boolean || {
	// 	[resource: function( mixed ) { return model || promise },]
	// 	allow: boolean || function(userModel[, resourceModel], actionName) { return boolean || promise }
	// }
	action: function( actionName, def ) {
		// This call is a getter, or it's an object of action definitions.
		if( arguments.length === 1 ) {
			if( typeof actionName == 'object' ) {
				forOwn(actionName, function( def, actionName ) {
					this.action(actionName, def);
				}.bind(this));
				return this;
			} else {
				// Get action.
				var action = this.actions[actionName];
				if( !action ) {
					var parts = actionName.split(':');
					while( !action && parts.pop() ) {
						action = this.actions[parts.join(':')+':*'];
					}
				}
				return action || this.actions['*'];
			}
		}
		
		var resource, allow;
		if( typeof def == 'object' ) {
			resource = def.resource;
			allow    = def.allow;
		} else {
			allow    = !!def;
		}
		
		if( this.actions[actionName] ) {
			throw new Error('Action already defined: '+actionName);
		}
		if( typeof allow != 'function' ) {
			var returnValue = !!allow;
			allow = function() { return returnValue };
		}
		if( resource && typeof resource != 'function' ) {
			resource = function( model ) { return model };
		}
		
		this.actions[actionName] = {
			name           : actionName,
			resource       : resource,
			allow          : allow
		};
		return this;
	}
});

function Play( mgr, user ) {
	this.mgr  = mgr;
	this.user = user;
	this.role = this._getUserRole(user);
}
extend(Play.prototype, {
	mgr      : undefined,
	user     : undefined,
	role     : undefined,
	resource : undefined,
	
	can: function( actionName ) {
		var action = this.mgr.gatherAction(actionName, this.role);
		if( !action ) {
			throw new Error('Action not found: '+actionName);
		}
		
		if( action.resource ) {
			var self = this;
			return {
				resource: function( mixed ) {
					return Promise.resolve(action.resource(mixed)).then(function( resource ) {
						self.resource = resource;
						return action.allow(self.user, resource, actionName);
					});
				}
			};
		} else {
			return Promise.resolve(action.allow(this.user, actionName));
		}
	},
	
	_getUserRole: function( user ) {
		return user.role;
	}
});