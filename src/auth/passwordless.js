var co           = require('co');
var util         = require('util');
var Passwordless = require('passwordless/lib/passwordless/passwordless');

function CustomPasswordless() {
	Passwordless.call(this);
}
util.inherits(CustomPasswordless, Passwordless);

CustomPasswordless.prototype.useTokenAsync = co.wrap(function*( token, uid ) {
	if( !token || !uid ) {
		throw new Error('Missing token or user ID');
	}
	
	var store = this._tokenStore;
	var valid = yield store.authenticateAsync(token, uid.toString());
	
	if( valid && !this._allowTokenReuse ) {
		yield store.invalidateUserAsync(uid);
	}
	return valid;
});

module.exports = new CustomPasswordless();