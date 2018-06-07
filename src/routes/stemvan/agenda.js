var config      = require('config')
  , createError = require('http-errors')
  , express     = require('express')
  , Promise     = require('bluebird');
var db          = require('../../db');

module.exports = function( app ) {
	var router = express.Router();
	app.use('/agenda', router);
	
	router.route('/')
	.all(fetchMeetings)
	.get(function( req, res, next ) {
		res.out('agenda/list', true, {
			meetings: req.meetings
		});
	});
};

function fetchMeetings( req, res, next ) {
	db.Meeting.findAll()
	.then(function( meetings ) {
		req.meetings = meetings;
		next();
	})
	.catch(next);
}