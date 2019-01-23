const config = require('config');
const db = require('../db');

module.exports = function( app ) {
	app.use(function( req, res, next ) {

		let siteId;

		let match = req.path.match(/\/site\/(\d+)?\//);
		if (match) {
			siteId = parseInt(match[1]);
		} else {
			siteId = config.siteId;
		}
		if (!siteId) return next();

		let where = {};
		if (typeof siteId === 'number') {
			where = { id: siteId }
		} else {
			where = { name: siteId }
		}

		db.Site
			.findOne({ where })
			.then(function( found ) {
				req.site = found;
				// console.log(req.site && [req.site.id, req.site.name]);
				next();
			})
			.catch(next);
	});

};
