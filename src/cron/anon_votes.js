var log = require('debug')('app:cron');
var db  = require('../db');

// Purpose
// -------
// Auto-close ideas that passed the deadline.
// 
// Runs every night at 4:00.
module.exports = {
	cronTime: '0 0 4 * * *',
	runOnInit: true,
	onTick: function() {
		db.Vote.anonimizeOldVotes()
		.then(function( metaData ) {
			if( metaData.affectedRows ) {
				log(`anonimized votes: ${metaData.affectedRows}`);
			}
		});
	}
};