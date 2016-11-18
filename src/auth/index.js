var util = require('../util');

module.exports = function( auth ) {
	require('./entities')(auth);
	require('./roles')(auth);
	require('./actions')(auth);
};