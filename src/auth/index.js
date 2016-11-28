var RolePlay = require('../RolePlay');

var auth = module.exports = new RolePlay({
	defaultRoleName: 'unknown'
});

var unknown   = auth.role('unknown');
var anonymous = unknown.role('anonymous');
var member    = anonymous.role('member');
var admin     = member.role('admin');

require('./default-unknown')(unknown);
require('./anonymous')(anonymous);
require('./member')(member);
require('./admin')(admin);