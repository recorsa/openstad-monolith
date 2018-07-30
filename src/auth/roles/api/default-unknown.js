module.exports = function( helpers, role ) {
	role.action({
		'dev'       : false,

		'idea:admin': false,

		'newsletter:signup' : {
			allow    : true,
			message  : 'U kunt zich niet aanmelden',
			resource : 'user'
		},

		'poll:vote'         : {
			allow    : helpers.mayVotePoll,
			message  : 'Stemmen niet toegestaan',
			resource : ['idea', 'poll']
		},
		'poll:result'      : {
			allow    : helpers.mayViewUserVoteForPoll,
			resource : 'poll'
		},

		'arguments:list'       : true,
		'argument:view'        : true,

		'argument:form'         : {
			allow    : helpers.mayAddArgument,
			resource : 'idea'
		},
		'argument:create'          : {
			allow    : helpers.mayAddArgument,
			resource : 'idea',
			message  : 'Argument toevoegen niet toegestaan'
		},
		'argument:reply:form'   : {
			allow    : helpers.mayReplyToArgument,
			resource : ['idea', 'argument']
		},
		'argument:reply'        : {
			allow    : helpers.mayReplyToArgument,
			resource : ['idea', 'argument']
		},
		'argument:edit'         : {
			allow    : helpers.mayMutateArgument,
			resource : ['idea', 'argument'],
			message  : 'Argument bewerken niet toegestaan'
		},
		'argument:delete'       : {
			allow    : helpers.mayMutateArgument,
			resource : ['idea', 'argument'],
			message  : 'Argument verwijderen niet toegestaan'
		},
		'argument:vote'         : {
			allow    : helpers.mayVoteArgument,
			resource : ['idea', 'argument'],
			message  : 'Stemmen kan enkel als geregistreerde gebruiker'
		},

		'sites:list'       : true,
		'site:view'        : true,
		'site:create'      : false,
		'site:edit'        : {
			allow    : false,
			resource : 'site',
			message  : 'Site bewerken niet toegestaan'
		},
		'site:delete'      : {
			allow    : false,
			resource : 'site'
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

		'user:mail'        : false
	});
};
