var express = require('express');

module.exports = function( app ) {
	app.use('/css', express.static('css'));
};