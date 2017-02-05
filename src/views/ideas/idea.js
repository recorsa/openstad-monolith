var clone = require('lodash/clone');

module.exports = function( req, res, data ) {
	var processed = clone(data);
	return processed;
};