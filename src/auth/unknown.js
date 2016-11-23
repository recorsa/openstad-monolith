module.exports = function( role ) {
	role.action({
		'index:view': true,
		'ideas:view': true,
		'idea:view': {
			allow: false,
			resource: 'idea'
		},
		'idea:create': {
			allow: false
		},
		'idea:vote': {
			allow: false
		},
		'idea:delete': {
			allow: false,
			resource: 'idea'
		}
	});
};