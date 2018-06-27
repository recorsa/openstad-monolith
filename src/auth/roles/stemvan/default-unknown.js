module.exports = function( helpers, role ) {
	role.action({
		'dev'              : false,
		
		'index:view'       : true,
		
		'account:register' : true,
		'account:complete' : false,
		
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
		
		'image:upload'     : {
			allow    : false,
			message  : 'Afbeelding uploaden niet toegestaan'
		},

		// articles
		'article:view'     : true,
		'article:create'   : false,
		'article:edit'     : {
			allow    : false,
			message  : 'Artikel bewerken niet toegestaan'
		},
		'article:delete'   : {
			allow    : false,
			message  : 'Artikel verwijderen niet toegestaan'
		},
		
		// Only used to determine whether to render the argument form.
		// When a user is not allowed to add an argument, we still show
		// the form, only disabled with login-on-focus.
		'arg:form'         : {
			allow    : helpers.maySeeArgForm,
			resource : 'idea'
		},
		'arg:add'          : {
			allow    : false,
			resource : 'idea',
			message  : 'Om een argument toe te voegen moet je ingelogd zijn'
		},
		'arg:reply:form'   : {
			allow    : helpers.maySeeReplyForm,
			resource : ['idea', 'argument']
		},
		'arg:reply'        : {
			allow    : false,
			resource : ['idea', 'argument']
		},
		'arg:edit'         : {
			allow    : false,
			resource : ['idea', 'argument'],
			message  : 'Argument bewerken niet toegestaan'
		},
		'arg:delete'       : {
			allow    : false,
			resource : ['idea', 'argument'],
			message  : 'Argument verwijderen niet toegestaan'
		},
		'arg:vote'         : {
			allow    : false,
			resource : ['idea', 'argument'],
			message  : 'Stemmen kan enkel als geregistreerde gebruiker'
		},
		
		'user:mail'        : false
	});
};

