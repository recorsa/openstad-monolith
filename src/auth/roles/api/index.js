var RolePlay = require('../../RolePlay');

var auth = new RolePlay({
	defaultError    : 'Geen toegang',
	defaultRoleName : 'unknown'
});

var unknown   = auth.role('unknown');
var anonymous = unknown.role('anonymous');
var admin     = anonymous.role('admin');

var helpers = {
	mayAddArgument: function( user, idea ) {
		return idea.isRunning();
	},
	mayReplyToArgument: function( user, idea, argument ) {
		return idea.isRunning() &&
		       !argument.parentId && user.can('idea:admin');
	},
	// TODO: Deny when arg replies exist.
	mayMutateArgument: function( user, idea, argument ) {
		return user.id === argument.userId &&
		       idea.isRunning();
	},
	mayVoteArgument: function( user, idea, argument ) {
		return idea.isRunning() && !argument.parentId;
	},
	mayVotePoll: function( user, idea, poll ) {
		return idea.isRunning() && poll.userVotes.length === 0;
	},
	mayViewUserVoteForPoll: function( user, poll ) {
		return poll.userVotes.length > 0;
	}
};

require('./default-unknown')(helpers, unknown);
require('./anonymous')(helpers, anonymous);
require('./admin')(helpers, admin);

module.exports = auth;
