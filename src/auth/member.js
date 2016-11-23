module.exports = function( role ) {
	role.action({
		'idea:view': true,
		'idea:create': {
			allow: true
		},
		'idea:delete': {
			allow: function( user, idea ) {
				return user.id === idea.id;
			}
		}
	});
};