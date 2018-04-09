var RolePlay = require('../../RolePlay');

var auth = new RolePlay({
	defaultError    : 'Geen toegang',
	defaultRoleName : 'unknown'
});

var unknown   = auth.role('unknown');
var anonymous = unknown.role('anonymous');
var admin     = anonymous.role('admin');

var helpers = {
	
};

require('./default-unknown')(helpers, unknown);
require('./anonymous')(helpers, anonymous);
require('./admin')(helpers, admin);

module.exports = auth;