const Promise     = require('bluebird');
const express     = require('express');
const createError = require('http-errors')
const db          = require('../../db');
const auth        = require('../../auth');

let router = express.Router({mergeParams: true});

// get idea, for all get requests
router
	.all('*', function(req, res, next) {
		var ideaId = parseInt(req.params.ideaId);
		db.Idea
			.scope('api')
			.findById(ideaId)
			.then(function( idea ) {
				if( !idea ) {
					next(createError(404, 'Idee niet gevonden'));
				} else {
					req.idea = idea;
					next();
				}
			})
			.catch(next);
	})

router.route('/')

// anonymous
// ---------
	.post(function(req, res, next) {
		console.log('Add user --------------------');
		let result = {result: 'user'};
		next();
	})


// add vote
// --------
	.post(auth.can('idea:vote'))
	.post(function(req, res, next) {
		console.log('VOTE ----------');
		req.idea
			.update(req.body)
			.then(result => {
				result = {"vote": req.body.opinion}
				res.json(result);
			})
			.catch(next);
	})

module.exports = router;
