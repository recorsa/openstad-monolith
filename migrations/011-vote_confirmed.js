var db = require('../src/db').sequelize;

module.exports = {
	up: function() {
		return db.query(`
			ALTER TABLE votes ADD confirmed INT NULL DEFAULT NULL AFTER userId;
		`);
	},
	down: function() {
		return db.query(`
			ALTER TABLE
				votes
			DROP
				confirmed;
		`);
	}
}
