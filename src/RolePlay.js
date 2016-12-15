'use strict';

var http        = require('http');
var ary         = require('lodash/ary');
var defaults    = require('lodash/defaults');
var extend      = require('lodash/extend');
var forOwn      = require('lodash/forOwn');
var result      = require('lodash/result');
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
	// Checks permission for the current user, and produces a 403 error when
	// access is denied. Passing multiple action is possible; by default only
	// the first action is required to be allowed for the request to succeed.
	// All consecutive actions are optional. Passing `true` as the last argument
	// makes all actions optional.
	// 
	// `req.user` must be set before this middleware runs. For permissions that
	// require a resource, `req.resource` must be set as well.
	// 
	// Adds `res.locals.can` as `function(actionName)` to check for the passed
	// permissions in template views.
	can: function( /* actionName [, actionName...] [, allOptional] */ ) {
		var self            = this;
		var actionNames_raw = Array.from(arguments);
		var lastArg         = actionNames_raw[actionNames_raw.length-1];
		var allOptional     = typeof lastArg === 'boolean' ?
		                      actionNames_raw.pop() :
		                      false;
		var actionNames     = this._getCanonicalActionNames(actionNames_raw);
		
		return function( req, res, next ) {
			if( !req.user ) {
				return next(createError(403, 'No authenticated user found'));
			}
			
			var user    = self.user(req.user);
			var allowed = actionNames.map(function( actionName ) {
				return user.can(actionName, req);
			});
			
			if( allOptional || allowed[0] ) {
				// Add `can(actionName)` function to locals, so the passed
				// permission can be checked in the template as well.
				var actions = zipObject(actionNames, allowed);
				self._addHelperFunction(req, res, actions);
				next();
			} else {
				var action       = user.get(actionNames[0]);
				var errorMessage = result(action, 'message') || 'Not authorized';
				next(createError(403, errorMessage));
			}
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
			} else if( role.mgr != this ) {
				throw new Error('Role already in use');
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
		} else if( !this.defaultRole.action(actionName) ) {
			throw new Error('Action not defined on default role: '+actionName);
		}
		
		while( role ) {
			if( action = role.action(actionName) ) {
				result = defaults(result || {}, action);
			}
			role = role.inherits;
		}
		return result;
	},
	
	// Used by `can` to assign a helper function to `req.can` and `res.locals.can`.
	_addHelperFunction: function( req, res, actions ) {
		var locals = res.locals;
		if( locals.can ) {
			extend(locals.can.actions, actions);
		} else {
			req.can = locals.can = function can( actionName ) {
				if( !(actionName in can.actions) ) {
					throw new Error('RolePlay action not available for this route: '+actionName);
				}
				return can.actions[actionName];
			};
			locals.can.actions = actions;
		}
	},
	// Used by `can` to expand action names like `entity:*` to a list of fully
	// qualified action names (e.g.: `entity:edit`, `entity:create` etc);
	_getCanonicalActionNames: function( actionNames ) {
		var role = this.defaultRole;
		var canonical = new Set;
		for( let actionName of actionNames ) {
			if( ~String(actionName).indexOf('*') ) {
				let sourceName = actionName.split(':');
				for( let actionName of Object.keys(role.actions) ) {
					let targetName = actionName.split(':');
					let i = 0, part;
					while( part = targetName.shift() ) {
						if( sourceName[i] != '*' && sourceName[i] != part ) {
							break;
						}
						i++;
					}
					if( i == sourceName.length ) {
						canonical.add(actionName);
					}
				}
			} else {
				canonical.add(actionName);
			}
		}
		
		return Array.from(canonical);
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
	// 	allow    : boolean || function(user[, resource], actionName) { return boolean },
	// 	resource : [function( mixed ) { return resource }],
	// 	message  : [string]
	// }
	action: function( actionName, def ) {
		var action;
		// This call is a getter, or it's an object of action definitions.
		if( arguments.length === 1 ) {
			if( typeof actionName === 'object' ) {
				forOwn(actionName, function( def, actionName ) {
					this.action(actionName, def);
				}.bind(this));
				return this;
			} else {
				// Get action.
				if( typeof actionName !== 'string' ) {
					throw new Error('Incorrect action name: '+actionName);
				}
				action = this.actions[actionName];
				if( !action ) {
					var parts = actionName.split(':');
					while( !action && parts.pop() ) {
						action = this.actions[parts.join(':')+':*'];
					}
				}
				return action || this.actions['*'];
			}
		}
		
		var resource, allow, message;
		if( def instanceof Object ) {
			resource = def.resource;
			allow    = def.allow;
			message  = def.message;
		} else {
			allow    = def;
		}
		
		if( this.actions[actionName] ) {
			throw new Error('Action already defined: '+actionName);
		}
		if( typeof allow !== 'function' ) {
			allow = this._createAllowFunction(allow);
		}
		if( resource && typeof resource !== 'function' ) {
			resource = this._createResourceFunction(resource);
		}
		
		action = this.actions[actionName] = {
			name           : actionName,
			resource       : resource,
			allow          : allow,
			message        : message
		};
		return this;
	},
	
	_createAllowFunction: function( allowValue ) {
		return function() { return !!allowValue };
	},
	_createResourceFunction: function( resourceValue ) {
		// return function( model ) { return model };
		return function( req ) {
			if( req && req.app && req instanceof http.IncomingMessage ) {
				var resource = req[resourceValue];
				if( !resource ) {
					throw new Error('Action \''+this.name+'\' requires resource req.'+resourceValue);
				}
				return resource;
			} else {
				return req;
			}
		};
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
	
	can: function( actionName, mixed ) {
		var action = this.get(actionName);
		if( !action ) {
			throw new Error('Action not found: '+actionName);
		}
		
		if( action.resource ) {
			var resource = action.resource(mixed);
			return action.allow(this.user, resource, actionName);
		} else {
			return action.allow(this.user, actionName);
		}
	},
	get: function( actionName ) {
		return this.mgr.gatherAction(actionName, this.role);
	},
	
	_getUserRole: function( user ) {
		return user.role;
	}
});