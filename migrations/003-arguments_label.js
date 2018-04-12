var db = require('../src/db').sequelize;

module.exports = {
	up: function() {
		return db.query(`
			ALTER TABLE
				arguments
			ADD
				label VARCHAR(255) NULL  DEFAULT NULL  AFTER description
		`);
	},
	down: function() {
		return db.query(`
			ALTER TABLE
				arguments
			DROP
				label
		`);
	}
}