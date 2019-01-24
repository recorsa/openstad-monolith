const express = require('express');

let router = express.Router({mergeParams: true});

// defaults and general
router.use( require('./defaults') );

// ideas
router.use( '/site/:siteId(\\d+)', require('./idea') );
// router.use( '/site/:siteId(\\d+)/idea', require('./idea.old') );

// arguments
router.use( '/site/:siteId(\\d+)', require('./argument') );

// sites
router.use( '/site', require('./site') );

// elements
router.use( '/', require('./elements') );

module.exports = router;
