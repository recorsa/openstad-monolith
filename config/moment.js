var config = require('config');
var moment = require('moment-timezone');

moment.tz.setDefault(config.get('timeZone'));
// TODO: Set this per request based on accept-language header or
//       logged in user preference?
moment.locale(config.get('locale'));