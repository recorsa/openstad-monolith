module.exports = function( role ) {
	role.action({
		'account:create': false,
		
		'idea:view': true,
		'idea:create': true,
		'idea:edit': {
			allow: mayMutateIdea
		},
		'idea:delete': {
			allow: mayMutateIdea
		}
	});
};

function mayMutateIdea( user, idea ) {
	// TODO: Time sensitivity?
	var isOwner   = user.id === idea.userId;
	var voteCount = idea.no + idea.yes + idea.abstain;
	return isOwner && !voteCount;
}