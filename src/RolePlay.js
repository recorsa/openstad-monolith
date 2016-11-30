var ary         = require('lodash/ary');
var defaults    = require('lodash/defaults');
var extend      = require('lodash/extend');
var forOwn      = require('lodash/forOwn');
var zipObject   = require('lodash/zipObject');
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
	
	// Express middleware
	// ------------------
	// For permissions that require a resource, make sure `req.resource` is set
	// before this middleware is called.
	// 
	// Adds `res.locals.can` as `function(actionName)` to check for the passed
	// permissions in template views.
	can: function( /* actionName [, actionName...] */ ) {
		var self        = this;
		var actionNames = Array.prototype.slice.call(arguments);
		
		return function( req, res, next ) {
			if( !req.user ) {
				return next(createError(403, 'No authenticated user found'));
			}
			
			var user      = self.user(req.user);
			var resource  = req.resource;
			var isAllowed = actionNames.map(function( actionName ) {
				if( !actionName ) {
					throw new Error('Action name required');
				}
				return self._isAllowed(user, actionName, resource);
			});
			
			Promise.all(isAllowed).then(function( allowed ) {
				if( allowed[0] ) {
					// Add `can(actionName)` function to locals, so the passed
					// permission can be checked in the template as well.
					var locals  = res.locals;
					var actions = zipObject(actionNames, allowed);
					if( locals.can ) {
						extend(locals.can.actions, actions);
					} else {
						locals.can = function can( actionName ) {
							return can.actions[actionName];
						};
						locals.can.actions = actions;
					}
					
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
	},
	
	// Used by `can` to check permissions.
	_isAllowed: function( user, actionName, resource ) {
		var can = user.can(actionName);
		if( can.resource ) {
			if( !resource ) {
				throw new Error('Action needs resource: '+actionName);
			}
			return can.resource(resource);
		} else {
			return can;
		}
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
		if( def instanceof Object ) {
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