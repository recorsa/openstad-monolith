var config = require('config');
var db     = require('./src/db');
var Server = require('./src/Server');

db.connect(config.get('database'));
Server.start(config.get('express.port'));