const fs = require('fs');
const Promise = require('bluebird');
const express = require('express');
const markdown = require('markdown').markdown;
const db      = require('../../db');
const auth    = require('../../auth');

let router = express.Router({mergeParams: true});

router.route('/')
	.get(function(req, res, next) {
		let readme = fs.readFileSync('src/routes/api/README.md').toString();
		let html = markdown.toHTML( readme );
		res.out('index.njk', true, {html})
	})

module.exports = router;
