var auth = require('authorized');

module.exports = {
	UnauthorizedError: auth.UnauthorizedError,
	NotFoundError: (function() {
		function NotFoundError() { Error.call(this) }
		NotFoundError.prototype = Object.create(Error);
		NotFoundError.prototype.constructor = NotFoundError;
		return NotFoundError;
	})()
};