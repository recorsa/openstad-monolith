const express = require('express');

let router = express.Router({mergeParams: true});

router.route('/')
	.get(function(req, res, next){
		res.out('', true, { csrfToken: req.csrfToken() });
	})

module.exports = router;
