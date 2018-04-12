module.exports = function( helpers, role ) {
	role.action({
		'poll:vote' : {
			allow   : function( user, poll ) {
				return poll.userVotes.length === 0;
			},
			message : 'U heeft reeds gestemd'
		}
	});
};

