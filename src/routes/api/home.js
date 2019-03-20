const fs = require('fs');
const Promise = require('bluebird');
const express = require('express');
const marked  = require('marked');
const db      = require('../../db');
const auth    = require('../../auth');

marked.setOptions({
  renderer: new marked.Renderer(),
  breaks: true,
});

let router = express.Router({mergeParams: true});

router.route('/')
	.get(function(req, res, next) {
		let readme = fs.readFileSync('src/routes/api/README.md').toString();
		let html = marked( readme );
		res.out('index.njk', true, {html})
	})

module.exports = router;
