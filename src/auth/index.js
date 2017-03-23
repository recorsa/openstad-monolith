var RolePlay = require('../RolePlay');

var auth = new RolePlay({
	defaultError    : 'Geen toegang',
	defaultRoleName : 'unknown'
});

var unknown   = auth.role('unknown');
var anonymous = unknown.role('anonymous');
var member    = anonymous.role('member');
var admin     = member.role('admin');

var helpers = {
	needsToCompleteRegistration: function( user ) {
		return !user.hasCompletedRegistration();
	},
	
	mayMutateIdea: function( user, idea ) {
		if( !idea.isOpen() ) {
			return false;
		}
		// TODO: Time sensitivity?
		var isOwner   = !helpers.isIdeaOwner(user, idea);
		var voteCount = idea.no + idea.yes + idea.abstain;
		var argCount  = idea.argumentsFor.length + idea.argumentsAgainst.length;
		return isOwner && !voteCount && !argCount;
	},
	
	mayVote: function( user, idea ) {
		return idea.isOpen();
	},
	
	mayAddArgument: function( user, idea ) {
		return !helpers.isIdeaOwner(user, idea) &&
		       idea.isOpen();
	},
	// TODO: Deny when arg replies exist.
	mayMutateArgument: function( user, idea, argument ) {
		return user.id === argument.userId &&
		       idea.isOpen();
	},
	
	isIdeaOwner: function( user, idea ) {
		return user.id === idea.userId;
	}
};

require('./roles/default-unknown')(helpers, unknown);
require('./roles/anonymous')(helpers, anonymous);
require('./roles/member')(helpers, member);
require('./roles/admin')(helpers, admin);

module.exports = auth;