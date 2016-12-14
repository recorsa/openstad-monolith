var RolePlay = require('../RolePlay');

var auth = new RolePlay({
	defaultRoleName: 'unknown'
});

var unknown   = auth.role('unknown');
var anonymous = unknown.role('anonymous');
var member    = anonymous.role('member');
var admin     = member.role('admin');

require('./roles/default-unknown')(unknown);
require('./roles/anonymous')(anonymous);
require('./roles/member')(member);
require('./roles/admin')(admin);

module.exports = auth;