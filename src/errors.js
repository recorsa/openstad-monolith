var auth = require('authorized');

module.exports = {
	UnauthorizedError : auth.UnauthorizedError,
	NotFoundError     : defineError()
};

function defineError( parentError ) {
	var parent = parentError || Error;
	
	function err( data ) {
		var message = typeof data == 'string' ? data :
		              typeof data == 'object' ? data.message :
		                                        null;
		parent.call(this, message);
		this.data = typeof data == 'object' ? data : {};
	}
	err.prototype = Object.create(parent);
	err.prototype.constructor = err;
	return err;
}