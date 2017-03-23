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
		
		'arg:add'          : {
			allow    : false,
			resource : 'idea',
			message  : 'Argumenten toevoegen niet toegestaan'
		},
		'arg:edit'         : {
			allow    : false,
			resource : ['idea', 'argument']
		},
		'arg:reply'        : {
			allow    : false,
			resource : 'argument'
		},
		'arg:delete'       : {
			allow    : false,
			resource : ['idea', 'argument'],
			message  : 'Argumenten verwijderen niet toegestaan'
		},
		
		'user:mail'        : false
	});
};

