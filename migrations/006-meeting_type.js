var db = require('../src/db').sequelize;

module.exports = {
	up: function() {
		return db.query(`
			ALTER TABLE
				meetings
			ADD
				type ENUM('selection','meeting') NOT NULL DEFAULT 'selection' AFTER id;
		`);
	},
	down: function() {
		return db.query(`
			ALTER TABLE
				users
			DROP
				type
		`);
	}
}
