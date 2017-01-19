module.exports = function( role ) {
	role.action({
		'*': true,
		'arg:reply': false
	});
};