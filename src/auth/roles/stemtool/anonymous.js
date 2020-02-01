module.exports = function( helpers, role ) {
	role.action({
		'poll:vote' : {
			allow   : helpers.mayVotePoll,
			message : 'U heeft reeds gestemd'
		}
	});
};

