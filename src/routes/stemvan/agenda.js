var config      = require('config');
var createError = require('http-errors');
var express     = require('express');
var Promise     = require('bluebird');

var auth        = require('../../auth');
var db          = require('../../db');

module.exports = function( app ) {
	var router = express.Router();
	app.use('/agenda', router);
	
	// View all meetings
	// -----------------
	router.route('/')
	.all(auth.can('agenda:admin'))
	.get(fetchMeetings)
	.get(function( req, res, next ) {
		res.out('agenda/list', true, {
			meetings  : req.meetings,
			csrfToken : req.csrfToken()
		});
	})
	
	// Add new meeting
	// ---------------
	router.route('/new')
	.all(auth.can('agenda:admin'))
	.post(function( req, res, next ) {
		var date = req.body.date;
		var type = req.body.type;
		
		db.Meeting.create({date, type})
		.then(function( meeting ) {
			req.flash('success', 'Vergadering toegevoegd');
			res.success('/agenda', meeting);
		})
		.catch(next);
	});
	
	// Toggle forceShow
	// ------------
	router.route('/:meetingId/toggleForceShow')
		.all(auth.can('agenda:admin'))
		.all(fetchMeeting)
		.put(function( req, res, next ) {
			console.log('++++++++++', req.params.meetingId);
			var forceShow = !req.meeting.forceShow;
			req.meeting.update({forceShow})
				.then(function( meeting ) {
					res.success('/agenda', meeting);
				})
				.catch(next);
		})
	
	// Edit meeting
	// ------------
	router.route('/:meetingId')
	.all(auth.can('agenda:admin'))
	.all(fetchMeeting)
	.put(function( req, res, next ) {
		var date = req.body.date;
		var type = req.body.type;
		
		req.meeting.update({date, type})
		.then(function( meeting ) {
			res.success('/agenda', meeting);
		})
		.catch(next);
	})
	.delete(function( req, res, next ) {
		req.meeting.destroy()
		.then(function() {
			res.success('/agenda', true);
		})
		.catch(next);
	});

};

function fetchMeetings( req, res, next ) {
	db.Meeting.scope('withIdea')
	.findAll({order: 'date'})
	.then(function( meetings ) {
		req.meetings = meetings;
		next();
	})
	.catch(next);
}
function fetchMeeting( req, res, next ) {
	var meetingId = req.params.meetingId;
	db.Meeting.findById(meetingId)
	.then(function( meeting ) {
		if( !meeting ) {
			throw createError(404, 'Vergadering niet gevonden');
		}
		req.meeting = meeting;
		next();
	})
	.catch(next);
}
