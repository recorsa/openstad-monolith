module.exports = function( role ) {
	role.action({
		'index:view': true,
		
		'account:create': true,
		
		'ideas:list': true,
		'idea:view' : true,
		'idea:create': false,
		'idea:vote': false,
		'idea:edit': {
			allow    : false,
			resource : 'idea'
		},
		'idea:delete': {
			allow    : false,
			resource : 'idea'
		}
	});
};