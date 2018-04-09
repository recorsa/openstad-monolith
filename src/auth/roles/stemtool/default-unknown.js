module.exports = function( helpers, role ) {
	role.action({
		'dev'       : false,
		
		'idea:admin': false,
		
		'poll:vote' : true,
		
		'user:mail' : false
	});
};

