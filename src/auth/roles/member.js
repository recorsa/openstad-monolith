module.exports = function( role ) {
	role.action({
		'account:register' : {
			allow   : needsToCompleteRegistration,
			message : 'Registreren is onnodig als u bent ingelogd'
		},
		'account:complete' : needsToCompleteRegistration,
		
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
	return user.id !== idea.userId &&
	       idea.isOpen();
}
function mayMutateArgument( user, idea, argument ) {
	return user.id === argument.userId &&
	       idea.isOpen();
}
function mayMutateIdea( user, idea ) {
	if( !idea.isOpen() ) {
		return false;
	}
	// TODO: Time sensitivity?
	var isOwner   = user.id === idea.userId;
	var voteCount = idea.no + idea.yes + idea.abstain;
	var argCount  = idea.argumentsFor.length + idea.argumentsAgainst.length;
	return isOwner && !voteCount && !argCount;
}