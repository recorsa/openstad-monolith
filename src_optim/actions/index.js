var util = require('../../src/util');

var actions = {};
util.invokeDir('./', function( action, actionName ) {
	actions[actionName] = action;
});

module.exports = actions;