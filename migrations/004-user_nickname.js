var db = require('../src/db').sequelize;

module.exports = {
	up: function() {
		return db.query(`
			ALTER TABLE
				users
			ADD
				nickName VARCHAR(64) NULL  DEFAULT NULL  AFTER passwordHash
		`);
	},
	down: function() {
		return db.query(`
			ALTER TABLE
				users
			DROP
				nickName
		`);
	}
}