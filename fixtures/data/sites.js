var moment    = require('moment-timezone');
var startDate = moment().subtract(24, 'days').startOf('day');

module.exports = [{
	id          : 1,
	createdAt   : moment('2017-01-31'),
	config      : {},
	name        : 'eerstesite',
	title       : 'De eerste site',
}];
