var db = require('../src/db').sequelize;

module.exports = {
	up: function() {
		return db.query(`
			ALTER TABLE
				arguments
			ADD
				confirmationRequired	varchar(255) NULL DEFAULT NULL AFTER userId;
		`);
	},
	down: function() {
		return db.query(`
			ALTER TABLE
				arguments
			DROP
				confirmationRequired;
		`);
	}
}
