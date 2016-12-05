module.exports = function( role ) {
	role.action({
		'account:create' : false,
		
		'idea:view'      : true,
		'idea:create'    : true,
		'arg:add'        : {
			allow   : mayAddArgument,
			message : 'U kunt geen argument aan uw eigen idee toevoegen'
		},
		'arg:edit'       : {
			allow   : mayMutateArgument
		},
		'idea:edit'      : {
			allow   : mayMutateIdea
		},
		'idea:delete'    : {
			allow   : mayMutateIdea
		}
	});
};

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