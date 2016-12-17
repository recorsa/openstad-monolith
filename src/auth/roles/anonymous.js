module.exports = function( role ) {
	role.action({
		'idea:vote': {
			allow: function( user, idea ) {
				return idea.isOpen();
			}
		}
	});
};