module.exports = function( helpers, role ) {
	role.action({
		'poll:vote' : {
			allow   : false,
			message : 'U heeft reeds gestemd'
		}
	});
};

