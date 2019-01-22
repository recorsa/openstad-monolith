module.exports = function( helpers, role ) {
	role.action({
		'*': true,
		'poll:vote' : {
			allow   : false,
			message : 'Beheerders kunnen niet deelnemen'
		},
		'arg:add' : {
			allow    : false,
			message  : 'Argument toevoegen niet toegestaan voor beheerders, reageren is wel toegestaan'
		},
	});
};
