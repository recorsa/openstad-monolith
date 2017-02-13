var Notifications = require('./Notifications');
var MemoryStore   = require('./MemoryStore');

var hub = new Notifications(new MemoryStore());
hub.subscribe(1, null, null, ['arg:*', '*:edit']);
hub.subscribe(2, 'idea', null, ['arg:add', 'vote']);

console.log(hub.trigger('idea', 1, 'arg:add'));
console.log(hub.trigger('foo', 10, 'bla:edit'));