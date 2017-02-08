var config = require('config');
process.env.DEBUG = config.get('logging');

var actions = require('./src_optim/actions');

process.stdin.resume();
process.send('ready');
console.log('listening for tasks');

process.on('message', function( task ) {
	var actionName = task.action;
	var params     = task.params;
	if( !actionName ) {
		throw Error('Action has no name');
	}
	
	var action = actions[actionName];
	if( !action ) {
		throw Error(`Action not found: ${actionName}`);
	}
	
	action(params).then(function() {
		process.send(task);
	});
});