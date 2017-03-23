module.exports = function( helpers, role ) {
	role.action({
		'*': true,
		'arg:reply': false
	});
};