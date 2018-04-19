module.exports = function( helpers, role ) {
	role.action({
		'dev'       : false,

		'idea:admin': false,

		'poll:vote' : {
			allow    : true,
			message  : 'Stemmen niet toegestaan',
			resource : 'poll'
		},

		'arg:form'         : {
			allow    : helpers.mayAddArgument,
			resource : 'idea'
		},
		'arg:add'          : {
			allow    : helpers.mayAddArgument,
			resource : 'idea',
			message  : 'Argument toevoegen niet toegestaan'
		},
		'arg:reply:form'   : {
			allow    : helpers.mayReplyToArgument,
			resource : ['idea', 'argument']
		},
		'arg:reply'        : {
			allow    : helpers.mayReplyToArgument,
			resource : ['idea', 'argument']
		},
		'arg:edit'         : {
			allow    : helpers.mayMutateArgument,
			resource : ['idea', 'argument'],
			message  : 'Argument bewerken niet toegestaan'
		},
		'arg:delete'       : {
			allow    : helpers.mayMutateArgument,
			resource : ['idea', 'argument'],
			message  : 'Argument verwijderen niet toegestaan'
		},
		'arg:vote'         : {
			allow    : helpers.mayVoteArgument,
			resource : ['idea', 'argument'],
			message  : 'Stemmen kan enkel als geregistreerde gebruiker'
		}
	});
};
