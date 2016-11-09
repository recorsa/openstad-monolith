// var config = require('config');

var Server = require('./src/Server');
Server.start(8082/*config.get('express.port')*/);