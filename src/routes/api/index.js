const express = require('express');

let router = express.Router({mergeParams: true});

// defaults and general
router.use( require('./defaults') );
router.use( '/csrf-token', require('./csrf-token') );

// sites
router.use( '/site', require('./site') );

// ideas
router.use( '/site/:siteId(\\d+)/idea', require('./idea') );
router.use( '/site/:siteId(\\d+)/idea', require('./idea.old') );

// vote
router.use( '/site/:siteId(\\d+)/idea/:ideaId(\\d+)/vote', require('./vote') );

// arguments
router.use( '/site/:siteId(\\d+)(/idea/:ideaId(\\d+))?/argument', require('./argument') );
router.use( '/site/:siteId(\\d+)/idea/:ideaId(\\d+)/argument', require('./argument.old') );

module.exports = router;
