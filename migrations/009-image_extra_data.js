var db = require('../src/db').sequelize;

module.exports = {
	up: function() {
		return db.query(`
			ALTER TABLE
				images
			ADD
				extraData TEXT NOT NULL AFTER mimeType
		`);
	},
	down: function() {
		return db.query(`
			ALTER TABLE
				images
			DROP
				extraData
		`);
	}
}
