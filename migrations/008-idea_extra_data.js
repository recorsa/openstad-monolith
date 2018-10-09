var db = require('../src/db').sequelize;

module.exports = {
	up: function() {
		return db.query(`
			ALTER TABLE
				ideas
			ADD
				extraData TEXT NOT NULL AFTER description
		`);
	},
	down: function() {
		return db.query(`
			ALTER TABLE
				ideas
			DROP
				extraData
		`);
	}
}
