module.exports = function( helpers, role ) {
	role.action({
		'account:register' : {
			allow   : helpers.needsToCompleteRegistration,
			message : 'Registreren is onnodig als u bent ingelogd'
		},
		'account:complete' : helpers.needsToCompleteRegistration,
		
		'idea:view'        : true,
		'idea:create'      : true,
		'idea:edit'        : helpers.mayMutateIdea,
		'idea:delete'      : helpers.mayMutateIdea,
		
		'image:upload'     : true,
		
		'arg:add'          : {
			allow   : helpers.mayAddArgument,
			message : 'U kunt geen argument aan uw eigen idee toevoegen'
		},
		'arg:edit'         : helpers.mayMutateArgument,
		'arg:reply'        : false,//helpers.mayReplyToArgument,
		'arg:delete'       : helpers.mayMutateArgument
	});
};

