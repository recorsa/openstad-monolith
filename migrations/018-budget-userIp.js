var db = require('../src/db').sequelize;

module.exports = {
	up: function() {
		return db.query(`
			ALTER TABLE budget_votes ADD userIp varchar(64) NOT NULL AFTER siteId;
		`);
	},
	down: function() {
		return db.query(`
		`);
		
	}
}
