const express = require('express');

let router = express.Router({mergeParams: true});

// defaults and general
router.use( require('./defaults') );

// ideas
router.use( '/site/:siteId(\\d+)/idea', require('./idea') );
// router.use( '/site/:siteId(\\d+)/idea', require('./idea.old') );

// arguments
// router.use( '/site/:siteId(\\d+)/idea/:ideaId(\\d+)/argument', require('./argument.old') );

module.exports = router;
