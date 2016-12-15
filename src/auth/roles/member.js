module.exports = function( role ) {
	role.action({
		'account:create'   : false,
		'account:complete' : needsToCompleteRegistration,
		'account:token'    : needsToCompleteRegistration,
		
		'idea:view'        : true,
		'idea:create'      : true,
		'idea:edit'        : mayMutateIdea,
		'idea:delete'      : mayMutateIdea,
		
		'arg:add'          : {
			allow   : mayAddArgument,
			message : 'U kunt geen argument aan uw eigen idee toevoegen'
		},
		'arg:edit'         : mayMutateArgument
	});
};

function needsToCompleteRegistration( user ) {
	return !user.hasCompletedRegistration();
}
function mayAddArgument( user, idea ) {
	return user.id !== idea.userId;
}
function mayMutateArgument( user, argument ) {
	return user.id === argument.userId;
}
function mayMutateIdea( user, idea ) {
	// TODO: Time sensitivity?
	var isOwner   = user.id === idea.userId;
	var voteCount = idea.no + idea.yes + idea.abstain;
	var argCount  = idea.argumentsFor.length + idea.argumentsAgainst.length;
	return isOwner && !voteCount && !argCount;
}