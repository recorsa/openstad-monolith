module.exports = function( helpers, role ) {
	role.action({
		'*': true,
		'poll:vote' : {
			allow   : false,
			message : 'Beheerders kunnen niet deelnemen'
		}
	});
};

