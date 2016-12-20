var config   = require('config');
var moment   = require('moment-timezone');
var nunjucks = require('nunjucks');
var nlib     = require('nunjucks/src/lib');
var slice    = Array.prototype.slice;

var timeZone      = config.get('timeZone');
var defaultFormat = null;

// Examples:
// {{ var | date }}
// {{ var | date('YYYY-MM-DD') }}
// {{ var | date('add', 1, 'week') }}
function dateFilter( date, format ) {
	try {
		var mom = moment.tz(date, timeZone);
		return nlib.isFunction(mom[format]) ?
		       mom[format].apply(mom, slice.call(arguments, 2)) :
		       mom.format(format || defaultFormat);
	} catch( error ) {
		return (error.message || message || 'dateFilter error').toString()
	}
}

// Set default format for date.
dateFilter.setDefaultFormat = function( format ) {
	defaultFormat = format;
};

module.exports = dateFilter;