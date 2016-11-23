var RolePlay = require('./RolePlay');

module.exports = {
	UnauthorizedError : RolePlay.UnauthorizedError,
	NotFoundError     : defineError('NotFoundError')
};

function defineError( name ) {
	function err( data ) {
		Error.captureStackTrace(this, this.constructor)
		var message  = typeof data == 'string' ? data :
		               typeof data == 'object' ? data.message :
		                                         '';
		this.name    = name;
		this.message = message;
		this.data    = typeof data == 'object' ? data : {};
	};
	err.prototype = Object.create(Error.prototype);
	err.prototype.constructor = err;
	return err;
}