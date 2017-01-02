module.exports = function( role ) {
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
			resource : 'idea'
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
		'arg:delete'       : {
			allow    : false,
			message  : 'Argumenten verwijderen niet toegestaan'
		}
	});
};