module.exports = function( helpers, role ) {
	role.action({
		'dev'       : false,

		'idea:admin': false,

		'newsletter:signup' : {
			allow    : true,
			message  : 'U kunt zich niet aanmelden',
			resource : 'user'
		},

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
		},


		'ideas:list'       : true,
		'ideas:archive'    : true,
		'idea:admin'       : false,
		'idea:view'        : true,
		'idea:create'      : false,
		'idea:vote'        : {
			allow    : false,
			resource : 'idea'
		},
		'idea:edit'        : {
			allow    : false,
			resource : 'idea',
			message  : 'Idee bewerken niet toegestaan'
		},
		'idea:delete'      : {
			allow    : false,
			resource : 'idea'
		},

	});
};
