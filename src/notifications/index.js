var ary           = require('lodash/ary');
var Promise       = require('bluebird');

var Notifications = require('./Notifications');
var MemoryStore   = require('./MemoryStore');

var hub = new Notifications(new MemoryStore());
hub.subscribe(1, null, null, ['arg:*', '*:edit']);
hub.subscribe(2, 'idea', null, ['arg:add', 'vote']);

Promise.all([
	hub.trigger('idea', 1, 'arg:add'),
	hub.trigger('foo', 10, 'bla:edit')
]).then(function( result ) {
	result.forEach(ary(console.log, 1));
});